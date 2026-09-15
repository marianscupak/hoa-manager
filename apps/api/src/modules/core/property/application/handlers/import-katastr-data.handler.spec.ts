import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ImportKatastrDataCommand } from '@/modules/core/property/application/commands/import-katastr-data.command';
import {
  ImportKatastrDataHandler,
  ownershipPlanErrorsToBlockers,
  transitionRejectionToBlocker,
} from '@/modules/core/property/application/handlers/import-katastr-data.handler';
import { PreviewKatastrImportHandler } from '@/modules/core/property/application/handlers/preview-katastr-import.handler';
import type { KatastrSnapshotRepository } from '@/modules/core/property/application/ports/katastr-snapshot.repository.port';
import type {
  OwnerRepository,
  UnitOwnershipRepository,
  UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { PreviewKatastrImportQuery } from '@/modules/core/property/application/queries/preview-katastr-import.query';
import { KatastrDataImportedAuditEvent } from '@/modules/core/property/audit/events/katastr-data-imported.event';
import { buildKatastrXml } from '@/modules/core/property/domain/katastr/__fixtures__/build-xml';
import { buildImportPlan } from '@/modules/core/property/domain/katastr/build-import-plan';
import type { RegisterSnapshot } from '@/modules/core/property/domain/katastr/import-plan';
import { parseKatastrDocument } from '@/modules/core/property/domain/katastr/parse-katastr-document';
import { computePlanHash } from '@/modules/core/property/domain/katastr/plan-hash';
import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import type { UnitOwnershipParty } from '@/modules/core/property/domain/property.entity';
import {
  formatAssociationDate,
  parseAssociationDate,
} from '@/shared/domain/association-date';

const FIXTURE = readFileSync(
  join(__dirname, '../../domain/katastr/__fixtures__/dum-vsechny-jednotky.xml'),
  'utf8',
);
const NOW = new Date('2026-09-15T12:00:00Z');

const FIXTURE_DOCUMENT = (() => {
  const parsed = parseKatastrDocument(FIXTURE);
  if (!parsed.ok) throw new Error('fixture must parse');
  return parsed.document;
})();

// The instant a *real* apply request carries when the admin accepted the
// default date: Prague midnight on ct:platnost's calendar day — exactly what
// `parseEffectiveDate`/preview's default produce since Task 7's Ruling A.
// Never the raw ct:platnost timestamp (2024-04-08T00:15:02.000Z): the real
// controller can never hand that to this command, so a test built on it
// would not exercise the seam a real apply call actually goes through.
const EFFECTIVE = parseAssociationDate(
  formatAssociationDate(FIXTURE_DOCUMENT.validAt),
)!;

/** The hash the admin would have been shown for a given register snapshot. */
function hashForSnapshot(
  xml: string,
  snapshot: RegisterSnapshot,
  effectiveAt: Date = EFFECTIVE,
): string {
  const parsed = parseKatastrDocument(xml);
  if (!parsed.ok) throw new Error('fixture must parse');
  const plan = buildImportPlan(parsed.document, snapshot, effectiveAt, NOW);
  plan.warnings.unshift(...parsed.warnings);
  return computePlanHash(xml, plan);
}

/** The hash the admin would have been shown for an empty register. */
function hashForEmptyRegister(xml = FIXTURE): string {
  return hashForSnapshot(xml, { units: [], owners: [] });
}

function build(snapshot: RegisterSnapshot = { units: [], owners: [] }) {
  const createdUnits: Record<string, unknown>[] = [];
  const updatedUnits: { unitId: string; input: Record<string, unknown> }[] = [];
  const createdOwners: Record<string, unknown>[] = [];
  const partyWrites: { unitId: string; count: number }[] = [];
  const appended: unknown[] = [];
  let locked = 0;
  let seq = 0;

  const snapshots: KatastrSnapshotRepository = {
    lockTenant: async () => {
      locked += 1;
    },
    load: async () => snapshot,
  };

  const unitRepo = {
    create: async (_t: string, input: Record<string, unknown>) => {
      seq += 1;
      const unit = { id: `unit-${seq}`, ...input };
      createdUnits.push(unit);
      return unit;
    },
    update: async (
      _t: string,
      unitId: string,
      input: Record<string, unknown>,
    ) => {
      updatedUnits.push({ unitId, input });
      return { id: unitId, ...input };
    },
  } as unknown as UnitRepository;

  const ownerRepo = {
    create: async (_t: string, input: Record<string, unknown>) => {
      seq += 1;
      const owner = { id: `owner-${seq}`, ...input };
      createdOwners.push(owner);
      return owner;
    },
    setKatastrPersonId: async () => undefined,
    // The real repository lists every owner of the tenant, not just the ones
    // this transaction created — a matched (pre-existing) owner is the
    // ordinary case on a second import, and `collectOwnerRefs` needs to see
    // it or `validateOwnershipPlan` throws UNKNOWN_OWNER for a perfectly
    // valid, already-registered party.
    listByTenant: async () => [
      ...snapshot.owners,
      ...createdOwners.map((o) => ({ ...o, kind: o.kind ?? OwnerKind.PERSON })),
    ],
  } as unknown as OwnerRepository;

  const ownershipRepo = {
    // Mirrors the real repository: every party the register already holds
    // for this unit, so the transition logic (close/delete/create) runs on
    // realistic input instead of always seeing an empty history.
    listByUnit: async (_t: string, unitId: string) =>
      snapshot.units.find((u) => u.id === unitId)?.parties ?? [],
    closeParties: async () => undefined,
    deleteParties: async () => undefined,
    createMany: async (_t: string, unitId: string, parties: unknown[]) => {
      partyWrites.push({ unitId, count: parties.length });
    },
  } as unknown as UnitOwnershipRepository;

  const handler = new ImportKatastrDataHandler(
    snapshots,
    unitRepo,
    ownerRepo,
    ownershipRepo,
    { execute: async <T>(work: () => Promise<T>) => work() } as never,
    { now: () => NOW },
    {
      append: async (event: { payload: unknown }) => {
        // The real AuditService parses every payload against the event's
        // `.strict()` schema before persisting it — the project's only gate
        // against an extra or mistyped field living in the audit trail
        // forever. Doing the same here, rather than just recording the
        // event, makes this fake fail the same way production would.
        KatastrDataImportedAuditEvent.descriptor.payloadSchema.parse(
          event.payload,
        );
        appended.push(event);
      },
    } as never,
    { requireActor: () => ({ type: 'USER', userId: 'admin-1' }) } as never,
    { resolveActorLabel: async () => 'Jan Admin' } as never,
  );

  return {
    handler,
    createdUnits,
    updatedUnits,
    createdOwners,
    partyWrites,
    appended,
    locked: () => locked,
  };
}

describe('ImportKatastrDataHandler', () => {
  it('imports the sample house behind one tenant lock', async () => {
    const ctx = build();
    const result = await ctx.handler.execute(
      new ImportKatastrDataCommand(
        't1',
        FIXTURE,
        EFFECTIVE,
        hashForEmptyRegister(),
      ),
    );

    expect(ctx.locked()).toBe(1);
    expect(ctx.createdUnits).toHaveLength(38);
    expect(ctx.createdOwners).toHaveLength(49);
    expect(ctx.partyWrites.reduce((sum, w) => sum + w.count, 0)).toBe(43);
    expect(result.counts).toEqual({
      unitsCreated: 38,
      unitsUpdated: 0,
      unitsUnchanged: 0,
      ownersCreated: 49,
      ownersMatched: 0,
    });
    // ct:platnost's calendar day (2024-04-08) — EFFECTIVE is Prague midnight
    // on that day (see its definition above), and the result reduces it the
    // same way the preview response does (C1): a calendar day, not the
    // instant it is midnight at.
    expect(result.effectiveAt).toBe('2024-04-08');
  });

  it('stores the identifiers the next import matches on', async () => {
    const ctx = build();
    await ctx.handler.execute(
      new ImportKatastrDataCommand(
        't1',
        FIXTURE,
        EFFECTIVE,
        hashForEmptyRegister(),
      ),
    );
    const unit = ctx.createdUnits[0];
    expect(unit.unitNo).toBe('132/1');
    expect(unit.katastrUnitId).toEqual(expect.any(String));
    // Measured from the fixture directly (see parse-katastr-document.spec.ts):
    // unit 132/1 is katastr id 18868306, whose ct:podil is 6342/206422 —
    // 132/2 (id 18869306) is the 3819 one.
    expect(unit.buildingShareNumerator).toBe(6342);
    expect(unit.buildingShareDenominator).toBe(206422);
    expect(unit.usageCode).toBe('1');
    expect(unit.usageName).toBe('byt');

    const owner = ctx.createdOwners[0];
    expect(owner.katastrPersonId).toEqual(expect.any(String));
    // The cadastre has no e-mail; the admin adds it through the invite flow.
    expect(owner.email).toBeNull();
    expect(owner.userId).toBeNull();
  });

  it('writes exactly one audit event for the whole import', async () => {
    const ctx = build();
    await ctx.handler.execute(
      new ImportKatastrDataCommand(
        't1',
        FIXTURE,
        EFFECTIVE,
        hashForEmptyRegister(),
      ),
    );
    expect(ctx.appended).toHaveLength(1);
    const event = ctx.appended[0] as {
      eventType: string;
      payload: {
        counts: { unitsCreated: number };
        document: { fileHash: string; lvNumber: string };
        warningCodes: string[];
      };
    };
    expect(event.eventType).toBe('CORE.KATASTR_DATA_IMPORTED');
    expect(event.payload.counts.unitsCreated).toBe(38);
    expect(event.payload.document.lvNumber).toBe('33');
    expect(event.payload.document.fileHash).toHaveLength(64);
    expect(event.payload.warningCodes).toEqual([]);
  });

  it('refuses a hash that does not match the plan it rebuilt, and writes nothing', async () => {
    const ctx = build();
    await expect(
      ctx.handler.execute(
        new ImportKatastrDataCommand('t1', FIXTURE, EFFECTIVE, 'stale-hash'),
      ),
    ).rejects.toMatchObject({
      response: { code: 'KATASTR_IMPORT_PLAN_STALE' },
    });
    expect(ctx.createdUnits).toHaveLength(0);
    expect(ctx.appended).toHaveLength(0);
  });

  it('hands back a fresh preview when the hash is stale', async () => {
    const ctx = build();
    const error = await ctx.handler
      .execute(new ImportKatastrDataCommand('t1', FIXTURE, EFFECTIVE, 'stale'))
      .catch((e: { response: { preview: { planHash: string } } }) => e);
    expect(
      (error as { response: { preview: { planHash: string } } }).response
        .preview.planHash,
    ).toBe(hashForEmptyRegister());
  });

  it('refuses a plan with blockers before writing anything', async () => {
    const ctx = build();
    // Both entrances become 132, so two units land on the same unit number.
    const clashing = FIXTURE.replaceAll(
      '<ct:cisloDomovni>133</ct:cisloDomovni>',
      '<ct:cisloDomovni>132</ct:cisloDomovni>',
    );
    await expect(
      ctx.handler.execute(
        new ImportKatastrDataCommand(
          't1',
          clashing,
          EFFECTIVE,
          hashForEmptyRegister(clashing),
        ),
      ),
    ).rejects.toMatchObject({
      response: { code: 'KATASTR_IMPORT_BLOCKED' },
    });
    expect(ctx.createdUnits).toHaveLength(0);
  });

  it('refuses a file the parser rejects, before opening a transaction', async () => {
    const ctx = build();
    await expect(
      ctx.handler.execute(
        new ImportKatastrDataCommand('t1', '<invoice/>', EFFECTIVE, 'any'),
      ),
    ).rejects.toMatchObject({
      response: { code: 'KATASTR_FILE_REJECTED' },
    });
    expect(ctx.locked()).toBe(0);
  });

  // The plan carries no valid_from, so "an unchanged unit keeps its ownership
  // history" is a property only the writer can preserve: nothing upstream
  // (the differ, the hash) would notice if every import rewrote every unit's
  // parties regardless of whether ownership actually changed.
  it('writes no ownership parties for a unit whose ownership did not change', async () => {
    // A single unit, one OFO owner, katastr id "u0" (build-xml.ts's default
    // for the first unit in the array), default 1/1 shares. The register
    // unit's own katastrUnitId matches it exactly, so this exercises the
    // primary match path buildImportPlan tries first (by katastr id), not
    // the unitNo fallback.
    const xml = buildKatastrXml({ units: [{}] });
    const snapshot: RegisterSnapshot = {
      units: [
        {
          id: 'existing-unit-1',
          unitNo: '132/1',
          katastrUnitId: 'u0',
          buildingShare: { num: 1n, den: 1n },
          usageCode: '1',
          usageName: 'byt',
          parties: [
            {
              id: 'existing-party-1',
              tenantId: 't1',
              unitId: 'existing-unit-1',
              partyType: OwnershipPartyType.SOLE,
              shareNumerator: 1,
              shareDenominator: 1,
              validFrom: new Date('2020-01-01T00:00:00Z'),
              validTo: null,
              memberOwnerIds: ['existing-owner-1'],
            },
          ],
        },
      ],
      owners: [
        {
          id: 'existing-owner-1',
          displayName: 'Jan Novák',
          kind: OwnerKind.PERSON,
          email: null,
          hasAccount: false,
          katastrPersonId: 'p0a',
          ico: null,
        },
      ],
    };

    const ctx = build(snapshot);
    const result = await ctx.handler.execute(
      new ImportKatastrDataCommand(
        't1',
        xml,
        EFFECTIVE,
        hashForSnapshot(xml, snapshot),
      ),
    );

    expect(result.counts.unitsUnchanged).toBe(1);
    expect(ctx.createdUnits).toHaveLength(0);
    expect(ctx.createdOwners).toHaveLength(0);
    // The one assertion that would fail if the ownership-write gate were
    // missing: an unchanged unit still carries `parties` (the parser always
    // produces them), so writing unconditionally would call createMany here.
    expect(ctx.partyWrites).toHaveLength(0);
  });

  // Replicates Task 7's prepend-then-hash order: parser warnings are folded
  // into plan.warnings before the hash is computed, not after and not
  // appended. Get this wrong and every confirmation of a file that carries a
  // warning answers 409 instead of succeeding.
  it('accepts a hash built with parser warnings folded in before hashing, and records them', async () => {
    // A unit and a party each with an empty share: both read as an implied
    // 1/1, producing an IMPLIED_FULL_SHARE warning on parse.
    const xml = buildKatastrXml({
      units: [{ share: null, parties: [{ share: null }] }],
    });
    const snapshot: RegisterSnapshot = { units: [], owners: [] };
    const correctHash = hashForSnapshot(xml, snapshot);

    const ctx = build(snapshot);
    const result = await ctx.handler.execute(
      new ImportKatastrDataCommand('t1', xml, EFFECTIVE, correctHash),
    );

    expect(result.counts.unitsCreated).toBe(1);
    const event = ctx.appended[0] as {
      payload: { warningCodes: string[] };
    };
    // Both the unit's own empty share and its party's empty share read as
    // implied 1/1, so two warnings are produced (one per node).
    expect(event.payload.warningCodes).toEqual([
      'IMPLIED_FULL_SHARE',
      'IMPLIED_FULL_SHARE',
    ]);

    // A hash computed from the plan *before* the parser warnings were
    // unshifted onto it is a different canonical JSON string — proving the
    // fold-in-before-hash order is load-bearing, not incidental.
    const parsed = parseKatastrDocument(xml);
    if (!parsed.ok) throw new Error('fixture must parse');
    const planWithoutWarnings = buildImportPlan(
      parsed.document,
      snapshot,
      EFFECTIVE,
      NOW,
    );
    const hashWithoutWarnings = computePlanHash(xml, planWithoutWarnings);
    expect(hashWithoutWarnings).not.toBe(correctHash);

    const ctx2 = build(snapshot);
    await expect(
      ctx2.handler.execute(
        new ImportKatastrDataCommand('t1', xml, EFFECTIVE, hashWithoutWarnings),
      ),
    ).rejects.toMatchObject({
      response: { code: 'KATASTR_IMPORT_PLAN_STALE' },
    });
  });

  // The feature's whole premise is a *repeatable* sync: "the register already
  // holds these owners, and exactly one unit changed hands" is the ordinary
  // second-import case, not an exotic one. Two units, both already in the
  // register and matched by katastr id: one keeps its current owner
  // (unchanged), the other's previous owner is replaced by the file's owner
  // (changed) — only the changed unit should get a party write.
  it('on a realistic second import, writes ownership only for the unit that actually changed hands', async () => {
    // Two units' building shares must sum to 1 across the building (a
    // parser-level check), so each is given a real 1/2 rather than the
    // single-unit default of an implied 1/1.
    const xml = buildKatastrXml({
      units: [
        { share: { num: '1', den: '2' } },
        { share: { num: '1', den: '2' } },
      ],
    });
    const snapshot: RegisterSnapshot = {
      units: [
        {
          id: 'existing-unit-a',
          unitNo: '132/1',
          katastrUnitId: 'u0',
          buildingShare: { num: 1n, den: 2n },
          usageCode: '1',
          usageName: 'byt',
          parties: [
            {
              id: 'existing-party-a',
              tenantId: 't1',
              unitId: 'existing-unit-a',
              partyType: OwnershipPartyType.SOLE,
              shareNumerator: 1,
              shareDenominator: 1,
              validFrom: new Date('2020-01-01T00:00:00Z'),
              validTo: null,
              // Matches the file's owner for both units (see below) — no
              // ownership change on this unit.
              memberOwnerIds: ['existing-owner-current'],
            },
          ],
        },
        {
          id: 'existing-unit-b',
          unitNo: '132/2',
          katastrUnitId: 'u1',
          buildingShare: { num: 1n, den: 2n },
          usageCode: '1',
          usageName: 'byt',
          parties: [
            {
              id: 'existing-party-b-old',
              tenantId: 't1',
              unitId: 'existing-unit-b',
              partyType: OwnershipPartyType.SOLE,
              shareNumerator: 1,
              shareDenominator: 1,
              validFrom: new Date('2020-01-01T00:00:00Z'),
              validTo: null,
              // Not referenced by the file at all — this unit's ownership
              // changed hands since the last import.
              memberOwnerIds: ['existing-owner-old'],
            },
          ],
        },
      ],
      owners: [
        {
          id: 'existing-owner-current',
          displayName: 'Jan Novák',
          kind: OwnerKind.PERSON,
          email: null,
          hasAccount: false,
          // The file's single default party owner (build-xml.ts) is always
          // katastr person "p0a" for every unit's first party.
          katastrPersonId: 'p0a',
          ico: null,
        },
        {
          id: 'existing-owner-old',
          displayName: 'Pavel Starý',
          kind: OwnerKind.PERSON,
          email: null,
          hasAccount: false,
          katastrPersonId: null,
          ico: null,
        },
      ],
    };

    const ctx = build(snapshot);
    const result = await ctx.handler.execute(
      new ImportKatastrDataCommand(
        't1',
        xml,
        EFFECTIVE,
        hashForSnapshot(xml, snapshot),
      ),
    );

    expect(result.counts.unitsUnchanged).toBe(1);
    expect(result.counts.unitsUpdated).toBe(1);
    expect(ctx.createdUnits).toHaveLength(0);
    expect(ctx.createdOwners).toHaveLength(0);
    // Unit A is genuinely UNCHANGED, so it is never touched at all — not
    // even a no-op update.
    expect(ctx.updatedUnits.map((u) => u.unitId)).toEqual(['existing-unit-b']);
    // Exactly one party write, for unit B alone — unit A's history is left
    // untouched.
    expect(ctx.partyWrites).toEqual([{ unitId: 'existing-unit-b', count: 1 }]);
  });

  // C1: the earlier version of this test used
  // formatAssociationDate/parseAssociationDate on both sides of the round
  // trip, which is exactly why it passed while the real portal page used
  // `iso.slice(0, 10)` on an instant and walked the date backwards by one
  // day in every zone west of UTC. The assertion now sits at the real
  // boundary: preview's response field, fed into apply completely
  // unreduced — after C1 the API already hands back a calendar day, so the
  // portal's own reduction of it is nothing more than reading it off the
  // response and putting it in the date input.
  it('accepts the plan hash from a real preview after the date round-trips through the portal (summer, ct:platnost default)', async () => {
    const snapshot: RegisterSnapshot = { units: [], owners: [] };
    const previewHandler = new PreviewKatastrImportHandler(
      { lockTenant: async () => undefined, load: async () => snapshot },
      { now: () => NOW },
    );
    const preview = await previewHandler.execute(
      new PreviewKatastrImportQuery('t1', FIXTURE, null),
    );

    // Pins the contract itself: a bare calendar day, never an instant.
    expect(preview.effectiveAt).toBe('2024-04-08');

    // The portal's own reduction: read `effectiveAt` off the response and
    // feed it straight to the date input — no slicing, no reformatting.
    // What the controller's parseEffectiveDate parses back on the apply
    // request is exactly this string.
    const effectiveAt = parseAssociationDate(preview.effectiveAt)!;

    const ctx = build(snapshot);
    const result = await ctx.handler.execute(
      new ImportKatastrDataCommand(
        't1',
        FIXTURE,
        effectiveAt,
        preview.planHash,
      ),
    );

    expect(result.counts.unitsCreated).toBe(38);
    expect(result.effectiveAt).toBe(preview.effectiveAt);
  });

  it('accepts the plan hash from a real preview after the date round-trips through the portal (winter, explicit date)', async () => {
    // CET (UTC+1), not CEST — the reviewer's second measured repro case.
    // An explicit effectiveAt bypasses the ct:platnost default so the round
    // trip is exercised on a winter date without a second fixture.
    const snapshot: RegisterSnapshot = { units: [], owners: [] };
    const previewHandler = new PreviewKatastrImportHandler(
      { lockTenant: async () => undefined, load: async () => snapshot },
      { now: () => NOW },
    );
    const preview = await previewHandler.execute(
      new PreviewKatastrImportQuery(
        't1',
        FIXTURE,
        parseAssociationDate('2024-01-15'),
      ),
    );
    expect(preview.effectiveAt).toBe('2024-01-15');

    const effectiveAt = parseAssociationDate(preview.effectiveAt)!;
    const ctx = build(snapshot);
    const result = await ctx.handler.execute(
      new ImportKatastrDataCommand(
        't1',
        FIXTURE,
        effectiveAt,
        preview.planHash,
      ),
    );

    expect(result.counts.unitsCreated).toBe(38);
    expect(result.effectiveAt).toBe('2024-01-15');
  });
});

describe('ownershipPlanErrorsToBlockers', () => {
  it('maps OwnershipPlanError codes into OWNERSHIP_PLAN_REJECTED blockers carrying unitNo, not raw ownership-plan shapes', () => {
    // The sharp case (M4): OwnershipPlanError's own MIXED_ASSOCIATION
    // collides by name with the katastr-level blocker of the same name,
    // but carries neither unitNo nor ownerName. Mapping to a distinct code
    // keeps the two from ever being confused, and always carries unitNo.
    const blockers = ownershipPlanErrorsToBlockers('132/1', [
      { code: 'MIXED_ASSOCIATION' },
      { code: 'DUPLICATE_OWNER', ownerId: 'owner-1' },
    ]);
    expect(blockers).toEqual([
      {
        code: 'OWNERSHIP_PLAN_REJECTED',
        unitNo: '132/1',
        reason: 'MIXED_ASSOCIATION',
      },
      {
        code: 'OWNERSHIP_PLAN_REJECTED',
        unitNo: '132/1',
        reason: 'DUPLICATE_OWNER',
      },
    ]);
  });
});

describe('transitionRejectionToBlocker', () => {
  const party = (
    over: Partial<UnitOwnershipParty> = {},
  ): UnitOwnershipParty => ({
    id: 'p1',
    tenantId: 't1',
    unitId: 'u1',
    partyType: OwnershipPartyType.SOLE,
    shareNumerator: 1,
    shareDenominator: 1,
    validFrom: new Date('2026-01-01T00:00:00Z'),
    validTo: null,
    memberOwnerIds: ['o1'],
    ...over,
  });

  it('shapes TRANSFER_ALREADY_SCHEDULED with just unitNo', () => {
    const blocker = transitionRejectionToBlocker(
      '132/1',
      { kind: 'REJECT', code: 'TRANSFER_ALREADY_SCHEDULED' },
      [party()],
    );
    expect(blocker).toEqual({
      code: 'TRANSFER_ALREADY_SCHEDULED',
      unitNo: '132/1',
    });
  });

  it('shapes EFFECTIVE_DATE_TOO_EARLY with the earliestAllowed the catalogue message requires — the bug M5 fixed', () => {
    // The earlier code pushed `{ code: transition.code, unitNo }` raw,
    // which for this code silently dropped `earliestAllowed` and left the
    // catalogue's {{earliestAllowed}} hole empty.
    const blocker = transitionRejectionToBlocker(
      '132/1',
      { kind: 'REJECT', code: 'EFFECTIVE_DATE_TOO_EARLY' },
      [party({ validFrom: new Date('2026-01-01T00:00:00Z') })],
    );
    expect(blocker).toEqual({
      code: 'EFFECTIVE_DATE_TOO_EARLY',
      unitNo: '132/1',
      // A calendar day, not the Prague-midnight instant validFrom holds —
      // the same fact C1 fixed for the top-level effectiveAt field.
      earliestAllowed: '2026-01-01',
    });
  });
});
