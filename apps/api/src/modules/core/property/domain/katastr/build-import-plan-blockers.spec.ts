import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildImportPlan } from '@/modules/core/property/domain/katastr/build-import-plan';
import type { KatastrDocument } from '@/modules/core/property/domain/katastr/katastr-document';
import type {
  RegisterSnapshot,
  RegisterUnit,
} from '@/modules/core/property/domain/katastr/import-plan';
import { parseKatastrDocument } from '@/modules/core/property/domain/katastr/parse-katastr-document';
import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import type { UnitOwnershipParty } from '@/modules/core/property/domain/property.entity';
import { formatAssociationDate } from '@/shared/domain/association-date';

const FIXTURE = readFileSync(
  join(__dirname, '__fixtures__/dum-vsechny-jednotky.xml'),
  'utf8',
);
const NOW = new Date('2026-09-15T12:00:00Z');
const EFFECTIVE = new Date('2024-04-08T00:15:02Z');

const fullDocument = (): KatastrDocument => {
  const result = parseKatastrDocument(FIXTURE);
  if (!result.ok) throw new Error('fixture must parse');
  return result.document;
};

/** The document reduced to the single unit 132/1, which has one OFO owner. */
const oneUnit = (): KatastrDocument => {
  const doc = fullDocument();
  return { ...doc, units: [doc.units.find((u) => u.unitNo === '132/1')!] };
};

const party = (over: Partial<UnitOwnershipParty> = {}): UnitOwnershipParty => ({
  id: 'p1',
  tenantId: 't',
  unitId: 'u1',
  partyType: OwnershipPartyType.SOLE,
  shareNumerator: 1,
  shareDenominator: 1,
  validFrom: new Date('2020-01-01T00:00:00Z'),
  validTo: null,
  memberOwnerIds: ['o-other'],
  ...over,
});

const unit = (over: Partial<RegisterUnit> = {}): RegisterUnit => ({
  id: 'u1',
  unitNo: '132/1',
  katastrUnitId: null,
  buildingShare: { num: 3819n, den: 206422n },
  usageCode: '1',
  usageName: 'byt',
  parties: [],
  ...over,
});

const codes = (snapshot: RegisterSnapshot, effective = EFFECTIVE) =>
  buildImportPlan(oneUnit(), snapshot, effective, NOW).blockers.map(
    (b) => b.code,
  );

describe('buildImportPlan — blockers', () => {
  it('blocks an effective date earlier than the unit latest period and names the earliest that works', () => {
    const latestStart = new Date('2026-01-01T00:00:00Z');
    const plan = buildImportPlan(
      oneUnit(),
      {
        units: [
          unit({
            katastrUnitId: oneUnit().units[0].katastrId,
            parties: [party({ validFrom: latestStart })],
          }),
        ],
        owners: [],
      },
      EFFECTIVE,
      NOW,
    );
    expect(plan.blockers).toEqual([
      {
        code: 'EFFECTIVE_DATE_TOO_EARLY',
        unitNo: '132/1',
        earliestAllowed: formatAssociationDate(latestStart),
      },
    ]);
  });

  it('names the closed period end as the earliest allowed date, not its start', () => {
    const closedEnd = new Date('2025-06-01T00:00:00Z');
    const plan = buildImportPlan(
      oneUnit(),
      {
        units: [
          unit({
            katastrUnitId: oneUnit().units[0].katastrId,
            parties: [
              party({
                validFrom: new Date('2023-01-01T00:00:00Z'),
                validTo: closedEnd,
              }),
            ],
          }),
        ],
        owners: [],
      },
      EFFECTIVE,
      NOW,
    );
    expect(plan.blockers).toEqual([
      {
        code: 'EFFECTIVE_DATE_TOO_EARLY',
        unitNo: '132/1',
        earliestAllowed: formatAssociationDate(closedEnd),
      },
    ]);
  });

  it('accepts the same effective date once it is not earlier than the latest period', () => {
    const plan = buildImportPlan(
      oneUnit(),
      {
        units: [
          unit({
            katastrUnitId: oneUnit().units[0].katastrId,
            parties: [party({ validFrom: new Date('2020-01-01T00:00:00Z') })],
          }),
        ],
        owners: [],
      },
      EFFECTIVE,
      NOW,
    );
    expect(plan.blockers).toEqual([]);
  });

  it('blocks a unit that already has a scheduled transfer', () => {
    expect(
      codes({
        units: [
          unit({
            katastrUnitId: oneUnit().units[0].katastrId,
            parties: [party({ validFrom: new Date('2026-12-01T00:00:00Z') })],
          }),
        ],
        owners: [],
      }),
    ).toEqual(['TRANSFER_ALREADY_SCHEDULED']);
  });

  it('does not check ownership-history timing when only the share or usage changed', () => {
    // The gate on checkTransition (ownershipChange === null) matters
    // precisely here: this unit's ownership is identical to the register, so
    // an ownership-history rule must not apply, even though the register's
    // latest period starts after EFFECTIVE — which would reject if checked.
    const doc = oneUnit();
    const docUnit = doc.units[0];
    const docParty = docUnit.parties[0];
    const person = docParty.members[0];
    const latestStart = new Date('2026-01-01T00:00:00Z');

    const plan = buildImportPlan(
      doc,
      {
        units: [
          unit({
            katastrUnitId: docUnit.katastrId,
            buildingShare: { num: 1n, den: 2n }, // differs, forces an UPDATE
            parties: [
              party({
                validFrom: latestStart,
                shareNumerator: Number(docParty.share.num),
                shareDenominator: Number(docParty.share.den),
                memberOwnerIds: [`new:${person.katastrPersonId}`],
              }),
            ],
          }),
        ],
        owners: [],
      },
      EFFECTIVE,
      NOW,
    );

    expect(plan.blockers).toEqual([]);
    expect(plan.units[0].action).toBe('UPDATE');
  });

  it('blocks two register owners that normalise to one name', () => {
    const person = oneUnit().units[0].parties[0].members[0];
    const plan = buildImportPlan(
      oneUnit(),
      {
        units: [unit({ katastrUnitId: oneUnit().units[0].katastrId })],
        owners: [
          {
            id: 'o1',
            displayName: person.displayName,
            kind: OwnerKind.PERSON,
            email: null,
            hasAccount: false,
            katastrPersonId: null,
            ico: null,
          },
          {
            id: 'o2',
            displayName: person.displayName
              .normalize('NFD')
              .replace(/[̀-ͯ]/g, ''),
            kind: OwnerKind.PERSON,
            email: null,
            hasAccount: false,
            katastrPersonId: null,
            ico: null,
          },
        ],
      },
      EFFECTIVE,
      NOW,
    );
    expect(plan.blockers).toEqual([
      {
        code: 'AMBIGUOUS_NAME',
        name: person.displayName,
        registerOwnerIds: ['o1', 'o2'],
        katastrPersonIds: [person.katastrPersonId],
      },
    ]);
  });

  it('blocks two register owners that share an IČO the document also carries', () => {
    const doc = fullDocument();
    // Same fixture person ("Město Volary", ico 250830) the two ICO-matching
    // tests in build-import-plan.spec.ts use, so all three exercise
    // identical data — pinned by value rather than "first ico found", which
    // would silently retarget this test if the fixture ever reorders units.
    const target = doc.units.find((u) =>
      u.parties.flatMap((p) => p.members).some((m) => m.ico === '250830'),
    )!;
    const person = target.parties
      .flatMap((p) => p.members)
      .find((m) => m.ico === '250830')!;
    const plan = buildImportPlan(
      { ...doc, units: [target] },
      {
        units: [],
        owners: [
          {
            id: 'o1',
            displayName: 'Company A',
            kind: OwnerKind.LEGAL_ENTITY,
            email: null,
            hasAccount: false,
            katastrPersonId: null,
            ico: person.ico,
          },
          {
            id: 'o2',
            displayName: 'Company B',
            kind: OwnerKind.LEGAL_ENTITY,
            email: null,
            hasAccount: false,
            katastrPersonId: null,
            ico: person.ico,
          },
        ],
      },
      EFFECTIVE,
      NOW,
    );
    expect(plan.blockers).toEqual([
      {
        code: 'AMBIGUOUS_ICO',
        ico: person.ico,
        registerOwnerIds: ['o1', 'o2'],
        katastrPersonIds: [person.katastrPersonId],
      },
    ]);
    const owner = plan.owners.find(
      (o) => o.katastrPersonId === person.katastrPersonId,
    )!;
    expect(owner.action).toBe('CREATE');
    expect(owner.existingOwnerId).toBeNull();
  });

  it('blocks an ASSOCIATION owner sharing a unit with another party', () => {
    const doc = fullDocument();
    // 3 units in the fixture have more than one ownership party.
    const shared = doc.units.find((u) => u.parties.length > 1)!;
    const promoted = shared.parties[0].members[0];
    const plan = buildImportPlan(
      { ...doc, units: [shared] },
      {
        units: [
          unit({ unitNo: shared.unitNo, katastrUnitId: shared.katastrId }),
        ],
        owners: [
          {
            id: 'o1',
            displayName: promoted.displayName,
            kind: OwnerKind.ASSOCIATION,
            email: null,
            hasAccount: false,
            katastrPersonId: promoted.katastrPersonId,
            ico: null,
          },
        ],
      },
      EFFECTIVE,
      NOW,
    );
    expect(plan.blockers).toContainEqual({
      code: 'MIXED_ASSOCIATION',
      unitNo: shared.unitNo,
      ownerName: promoted.displayName,
    });
  });

  it("does not check association mixing when a unit's ownership has not changed", () => {
    // Mirrors the design's own end state: an OPO imports as LEGAL_ENTITY and
    // the admin promotes it to ASSOCIATION afterwards. On the next import
    // this unit's ownership is unchanged, so it must not be blocked even
    // though the promoted owner now shares the unit with another party.
    const doc = fullDocument();
    const shared = doc.units.find((u) => u.parties.length > 1)!;
    const promoted = shared.parties[0].members[0];

    const echoParties = shared.parties.map((p) =>
      party({
        partyType:
          p.type === 'BSM' ? OwnershipPartyType.SJM : OwnershipPartyType.SOLE,
        shareNumerator: Number(p.share.num),
        shareDenominator: Number(p.share.den),
        memberOwnerIds: p.members.map((m) =>
          m.katastrPersonId === promoted.katastrPersonId
            ? 'o1'
            : `new:${m.katastrPersonId}`,
        ),
      }),
    );

    const plan = buildImportPlan(
      { ...doc, units: [shared] },
      {
        units: [
          unit({
            unitNo: shared.unitNo,
            katastrUnitId: shared.katastrId,
            buildingShare: shared.buildingShare,
            usageCode: shared.usageCode,
            usageName: shared.usageName,
            parties: echoParties,
          }),
        ],
        owners: [
          {
            id: 'o1',
            displayName: promoted.displayName,
            kind: OwnerKind.ASSOCIATION,
            email: null,
            hasAccount: false,
            katastrPersonId: promoted.katastrPersonId,
            ico: null,
          },
        ],
      },
      EFFECTIVE,
      NOW,
    );

    expect(plan.blockers).toEqual([]);
    expect(plan.units[0].action).toBe('UNCHANGED');
  });

  it('blocks a rename onto a number another register unit holds', () => {
    const doc = oneUnit();
    const plan = buildImportPlan(
      doc,
      {
        units: [
          unit({
            id: 'u1',
            unitNo: '1A',
            katastrUnitId: doc.units[0].katastrId,
          }),
          unit({ id: 'u2', unitNo: '132/1' }),
        ],
        owners: [],
      },
      EFFECTIVE,
      NOW,
    );
    expect(plan.blockers).toEqual([
      {
        code: 'UNIT_NO_COLLISION',
        unitNo: '132/1',
        incomingKatastrUnitId: doc.units[0].katastrId,
        heldByUnitId: 'u2',
      },
    ]);
  });

  it('blocks a rename even when the holder is renamed away in the same import', () => {
    // Chains and swaps are refused rather than ordered; cadastre unit numbers
    // identify the physical unit and do not move, so this is a manual rename.
    const doc = fullDocument();
    const a = doc.units.find((u) => u.unitNo === '132/1')!;
    const b = doc.units.find((u) => u.unitNo === '132/2')!;
    const plan = buildImportPlan(
      { ...doc, units: [a, b] },
      {
        units: [
          unit({ id: 'u1', unitNo: '132/2', katastrUnitId: a.katastrId }),
          unit({ id: 'u2', unitNo: '132/1', katastrUnitId: b.katastrId }),
        ],
        owners: [],
      },
      EFFECTIVE,
      NOW,
    );
    expect(plan.blockers.map((x) => x.code)).toEqual([
      'UNIT_NO_COLLISION',
      'UNIT_NO_COLLISION',
    ]);
  });

  it('blocks two document units that compute the same unit number', () => {
    // Task 1: the parser de-duplicates by the cadastre's ct:id, not by unit
    // number, so two distinct cadastre units can share one computed unitNo.
    const doc = fullDocument();
    const a = doc.units.find((u) => u.unitNo === '132/1')!;
    const b = doc.units.find((u) => u.unitNo === '132/2')!;
    const plan = buildImportPlan(
      { ...doc, units: [a, { ...b, unitNo: a.unitNo }] },
      { units: [], owners: [] },
      EFFECTIVE,
      NOW,
    );
    expect(plan.blockers).toEqual([
      {
        code: 'UNIT_NO_COLLISION',
        unitNo: '132/1',
        incomingKatastrUnitId: b.katastrId,
        heldByUnitId: null,
      },
    ]);
  });

  it('leaves a clean first import with no blockers', () => {
    expect(
      buildImportPlan(fullDocument(), { units: [], owners: [] }, EFFECTIVE, NOW)
        .blockers,
    ).toEqual([]);
  });
});
