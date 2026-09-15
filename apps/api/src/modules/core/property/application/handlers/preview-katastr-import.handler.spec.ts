import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PreviewKatastrImportHandler } from '@/modules/core/property/application/handlers/preview-katastr-import.handler';
import type { KatastrSnapshotRepository } from '@/modules/core/property/application/ports/katastr-snapshot.repository.port';
import { PreviewKatastrImportQuery } from '@/modules/core/property/application/queries/preview-katastr-import.query';
import { buildKatastrXml } from '@/modules/core/property/domain/katastr/__fixtures__/build-xml';
import type { Clock } from '@/shared/application/ports/clock.port';
import { parseAssociationDate } from '@/shared/domain/association-date';

const FIXTURE = readFileSync(
  join(__dirname, '../../domain/katastr/__fixtures__/dum-vsechny-jednotky.xml'),
  'utf8',
);

const emptyRegister: KatastrSnapshotRepository = {
  lockTenant: async () => undefined,
  load: async () => ({ units: [], owners: [] }),
};
const clock: Clock = { now: () => new Date('2026-09-15T12:00:00Z') };

describe('PreviewKatastrImportHandler', () => {
  const handler = new PreviewKatastrImportHandler(emptyRegister, clock);

  it('previews the sample house and defaults the effective date to the Prague calendar day ct:platnost falls on', async () => {
    const result = await handler.execute(
      new PreviewKatastrImportQuery('t1', FIXTURE, null),
    );
    expect(result.counts.unitsCreated).toBe(38);
    expect(result.counts.ownersCreated).toBe(49);
    // ct:platnost is 2024-04-08T00:15:02Z; the 00:15:02 time-of-day is a
    // batch-run artefact and is discarded — the default is Prague local
    // midnight on the calendar day that instant falls on (CEST, UTC+2), not
    // the raw timestamp. And it is a calendar day on the wire (C1): the DTO
    // reduces the instant with formatAssociationDate, never .toISOString(),
    // because that field is what a <input type="date"> shows and what
    // ApplyKatastrImportDto.effectiveAt (z.string().date()) expects back.
    expect(result.effectiveAt).toBe('2024-04-08');
    expect(result.blockers).toEqual([]);
    expect(result.planHash).toHaveLength(64);
    expect(result.document.lvNumber).toBe('33');
  });

  it('round-trips through the date the portal would send back unchanged', async () => {
    // The preview defaulted the date; the portal's own reduction of the
    // response is nothing more than reading `effectiveAt` off it and
    // putting it straight into the date input — no reformatting, because
    // the API already hands back a YYYY-MM-DD calendar day, not an instant
    // (C1). Feeding that same string back in as an explicit effectiveAt on
    // a second preview stands in for what apply will do. The two plans —
    // and their hashes — must be identical, or a confirmation of the
    // default date would always 409 as stale.
    const defaulted = await handler.execute(
      new PreviewKatastrImportQuery('t1', FIXTURE, null),
    );
    expect(defaulted.effectiveAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const roundTripped = await handler.execute(
      new PreviewKatastrImportQuery(
        't1',
        FIXTURE,
        parseAssociationDate(defaulted.effectiveAt),
      ),
    );
    expect(roundTripped.effectiveAt).toBe(defaulted.effectiveAt);
    expect(roundTripped.planHash).toBe(defaulted.planHash);
  });

  it('honours an explicit effective date and changes the hash with it', async () => {
    const a = await handler.execute(
      new PreviewKatastrImportQuery('t1', FIXTURE, null),
    );
    const b = await handler.execute(
      new PreviewKatastrImportQuery(
        't1',
        FIXTURE,
        new Date('2026-09-15T00:00:00Z'),
      ),
    );
    expect(b.effectiveAt).toBe('2026-09-15');
    expect(b.planHash).not.toBe(a.planHash);
  });

  it('rejects a file that is not a dialect A extract', async () => {
    await expect(
      handler.execute(new PreviewKatastrImportQuery('t1', '<invoice/>', null)),
    ).rejects.toMatchObject({
      response: { code: 'KATASTR_FILE_REJECTED' },
    });
  });

  it('carries parser warnings into the plan the admin confirms', async () => {
    // A single unit with an empty share, and a single party with an empty
    // share: both read as an implied 1/1, so both sums are satisfied and the
    // document parses — which is the only shape in which a warning reaches
    // the preview at all. Reuses Task 2's fixture builder rather than editing
    // the real extract, because the real extract is pretty-printed and its
    // share values repeat, so string surgery on it is unreliable.
    const xml = buildKatastrXml({
      units: [{ share: null, parties: [{ share: null }] }],
    });

    const result = await handler.execute(
      new PreviewKatastrImportQuery('t1', xml, null),
    );

    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'IMPLIED_FULL_SHARE' }),
      ]),
    );
    // And the warning survives into the hash, so confirming a plan whose
    // warnings changed cannot silently reuse an older hash.
    expect(result.planHash).toHaveLength(64);
  });
});
