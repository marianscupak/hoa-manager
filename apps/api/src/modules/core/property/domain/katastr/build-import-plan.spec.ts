import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildImportPlan } from '@/modules/core/property/domain/katastr/build-import-plan';
import type {
  ImportPlan,
  RegisterSnapshot,
} from '@/modules/core/property/domain/katastr/import-plan';
import type {
  KatastrDocument,
  KatastrParty,
  KatastrPerson,
} from '@/modules/core/property/domain/katastr/katastr-document';
import { parseKatastrDocument } from '@/modules/core/property/domain/katastr/parse-katastr-document';
import { computePlanHash } from '@/modules/core/property/domain/katastr/plan-hash';
import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';

const FIXTURE = readFileSync(
  join(__dirname, '__fixtures__/dum-vsechny-jednotky.xml'),
  'utf8',
);

const NOW = new Date('2026-09-15T12:00:00Z');
const EFFECTIVE = new Date('2024-04-08T00:15:02Z');

const document = (): KatastrDocument => {
  const result = parseKatastrDocument(FIXTURE);
  if (!result.ok) throw new Error('fixture must parse');
  return result.document;
};

const empty = (): RegisterSnapshot => ({ units: [], owners: [] });

/** Simulates the write so a second plan can be built against the result. */
function applyPlanToSnapshot(
  snapshot: RegisterSnapshot,
  plan: ImportPlan,
): RegisterSnapshot {
  const owners = snapshot.owners.map((o) => ({ ...o }));
  const ownerIdByPerson = new Map<string, string>();

  for (const planned of plan.owners) {
    if (planned.action === 'CREATE') {
      const id = `owner-${planned.katastrPersonId}`;
      owners.push({
        id,
        displayName: planned.displayName,
        kind: planned.kind,
        email: null,
        hasAccount: false,
        katastrPersonId: planned.katastrPersonId,
        ico: planned.ico,
      });
      ownerIdByPerson.set(planned.katastrPersonId, id);
      continue;
    }
    const existing = owners.find((o) => o.id === planned.existingOwnerId);
    if (existing === undefined) throw new Error('matched owner must exist');
    if (planned.backfillKatastrId) {
      existing.katastrPersonId = planned.katastrPersonId;
    }
    if (planned.backfillIco) existing.ico = planned.ico;
    ownerIdByPerson.set(planned.katastrPersonId, existing.id);
  }

  const units = snapshot.units.map((u) => ({ ...u }));
  for (const planned of plan.units) {
    const parties = planned.parties.map((p, i) => ({
      id: `party-${planned.katastrUnitId}-${i}`,
      tenantId: 't',
      unitId: planned.existingUnitId ?? `unit-${planned.katastrUnitId}`,
      partyType: p.partyType,
      shareNumerator: Number(p.share.num),
      shareDenominator: Number(p.share.den),
      validFrom: plan.effectiveAt,
      validTo: null,
      memberOwnerIds: p.memberKatastrPersonIds.map((k) => {
        const id = ownerIdByPerson.get(k);
        if (id === undefined) throw new Error(`no owner for ${k}`);
        return id;
      }),
    }));

    // Writes come from the write-value fields, never from the display pairs:
    // parsing "3819/206422" back into numbers is the bug this avoids, and an
    // UNCHANGED unit has no change object to read at all.
    if (planned.action === 'CREATE') {
      units.push({
        id: `unit-${planned.katastrUnitId}`,
        unitNo: planned.unitNo,
        katastrUnitId: planned.katastrUnitId,
        buildingShare: planned.buildingShare,
        usageCode: planned.usageCodeToWrite,
        usageName: planned.usageNameToWrite,
        parties,
      });
      continue;
    }
    const existing = units.find((u) => u.id === planned.existingUnitId);
    if (existing === undefined) throw new Error('matched unit must exist');
    if (planned.backfillKatastrId) {
      existing.katastrUnitId = planned.katastrUnitId;
    }
    if (planned.unitNoChange !== null)
      existing.unitNo = planned.unitNoChange.to;
    existing.buildingShare = planned.buildingShare;
    existing.usageCode = planned.usageCodeToWrite;
    existing.usageName = planned.usageNameToWrite;
    if (planned.ownershipChange !== null) existing.parties = parties;
  }

  return { units, owners };
}

describe('buildImportPlan — first import into an empty register', () => {
  const plan = () => buildImportPlan(document(), empty(), EFFECTIVE, NOW);

  it('creates all 38 units and 49 owners with no blockers', () => {
    const p = plan();
    expect(p.blockers).toEqual([]);
    expect(p.units).toHaveLength(38);
    expect(p.units.every((u) => u.action === 'CREATE')).toBe(true);
    // 39 subjects but 49 people: the ten BSM subjects hold two each.
    expect(p.owners).toHaveLength(49);
    expect(p.owners.every((o) => o.action === 'CREATE')).toBe(true);
  });

  it('maps OFO to SOLE, BSM to SJM and OPO to a legal entity', () => {
    const parties = plan().units.flatMap((u) => u.parties);
    expect(
      parties.filter((p) => p.partyType === OwnershipPartyType.SJM),
    ).toHaveLength(10);
    expect(
      parties.filter((p) => p.partyType === OwnershipPartyType.SOLE),
    ).toHaveLength(33);
    expect(
      parties
        .filter((p) => p.partyType === OwnershipPartyType.SJM)
        .every((p) => p.memberKatastrPersonIds.length === 2),
    ).toBe(true);

    const kinds = plan().owners.map((o) => o.kind);
    expect(kinds.filter((k) => k === OwnerKind.LEGAL_ENTITY)).toHaveLength(2);
    // Nothing becomes ASSOCIATION on import; the admin promotes it by hand.
    expect(kinds).not.toContain(OwnerKind.ASSOCIATION);
  });

  it('lists nothing as missing from the file', () => {
    expect(plan().unitsNotInFile).toEqual([]);
    expect(plan().ownersNotInFile).toEqual([]);
  });
});

describe('buildImportPlan — idempotence', () => {
  it('finds nothing to do when the same file is imported twice', () => {
    const doc = document();
    const first = buildImportPlan(doc, empty(), EFFECTIVE, NOW);
    const after = applyPlanToSnapshot(empty(), first);

    const second = buildImportPlan(doc, after, EFFECTIVE, NOW);

    expect(second.blockers).toEqual([]);
    expect(second.warnings).toEqual([]);
    expect(second.units).toHaveLength(38);
    expect(second.units.every((u) => u.action === 'UNCHANGED')).toBe(true);
    expect(second.units.every((u) => u.ownershipChange === null)).toBe(true);
    expect(
      second.owners.every((o) => o.action === 'MATCHED_BY_KATASTR_ID'),
    ).toBe(true);
    expect(second.owners.every((o) => !o.backfillKatastrId)).toBe(true);
  });
});

describe('buildImportPlan — ownership change preview', () => {
  it('names a current co-owner the file no longer mentions by display name', () => {
    const doc = document();
    const first = buildImportPlan(doc, empty(), EFFECTIVE, NOW);
    const after = applyPlanToSnapshot(empty(), first);

    // 132/15 is held 1/2 + 1/2 by Emil and Karel Wolf. Karel buys Emil out.
    const unit = doc.units.find((u) => u.unitNo === '132/15')!;
    const karel = unit.parties.find((p) =>
      p.members.some((m) => m.displayName === 'Karel Wolf'),
    )!;
    const bought: KatastrDocument = {
      ...doc,
      units: doc.units.map((u) =>
        u === unit
          ? { ...u, parties: [{ ...karel, share: { num: 1n, den: 1n } }] }
          : u,
      ),
    };

    const plan = buildImportPlan(bought, after, EFFECTIVE, NOW);
    const planned = plan.units.find((u) => u.unitNo === '132/15')!;

    expect(planned.action).toBe('UPDATE');
    expect(
      planned.ownershipChange!.from.flatMap((p) => p.memberNames).sort(),
    ).toEqual(['Emil Wolf', 'Karel Wolf']);
  });
});

describe('buildImportPlan — field-level update rules', () => {
  const oneUnitDoc = (): KatastrDocument => {
    const doc = document();
    return { ...doc, units: [doc.units.find((u) => u.unitNo === '132/1')!] };
  };

  const registerUnit = (over: Partial<RegisterSnapshot['units'][0]> = {}) => ({
    id: 'u1',
    unitNo: '132/1',
    katastrUnitId: null,
    buildingShare: { num: 3819n, den: 206422n },
    usageCode: '1',
    usageName: 'byt',
    parties: [],
    ...over,
  });

  it('backfills katastr_unit_id when the unit matched by unit_no', () => {
    const plan = buildImportPlan(
      oneUnitDoc(),
      { units: [registerUnit()], owners: [] },
      EFFECTIVE,
      NOW,
    );
    const unit = plan.units[0];
    expect(unit.existingUnitId).toBe('u1');
    expect(unit.backfillKatastrId).toBe(true);
    expect(unit.action).toBe('UPDATE');
  });

  it('treats a non-reduced restatement of the same share as no change', () => {
    const doc = document();
    const target = doc.units.find((u) => u.unitNo === '133/19')!;
    const single = { ...doc, units: [target] };
    // 133/19's real share is already in lowest terms (gcd(1587, 206422) = 1),
    // so the non-reduced twin is built by scaling up: halving an odd
    // numerator would silently change the value instead of restating it.
    const nonReduced = {
      num: target.buildingShare.num * 2n,
      den: target.buildingShare.den * 2n,
    };
    expect(nonReduced.den).not.toBe(target.buildingShare.den);

    const plan = buildImportPlan(
      single,
      {
        units: [
          registerUnit({
            unitNo: '133/19',
            katastrUnitId: target.katastrId,
            buildingShare: nonReduced,
            usageCode: target.usageCode,
            usageName: target.usageName,
          }),
        ],
        owners: [],
      },
      EFFECTIVE,
      NOW,
    );
    expect(plan.units[0].shareChange).toBeNull();
  });

  it('proposes the cadastre unit number when matched by katastr id', () => {
    const doc = oneUnitDoc();
    const plan = buildImportPlan(
      doc,
      {
        units: [
          registerUnit({ unitNo: '1A', katastrUnitId: doc.units[0].katastrId }),
        ],
        owners: [],
      },
      EFFECTIVE,
      NOW,
    );
    expect(plan.units[0].unitNoChange).toEqual({ from: '1A', to: '132/1' });
  });

  it('matches an owner by name, keeps their spelling, email and account', () => {
    const doc = oneUnitDoc();
    const person = doc.units[0].parties[0].members[0];
    const plan = buildImportPlan(
      doc,
      {
        units: [registerUnit({ katastrUnitId: doc.units[0].katastrId })],
        owners: [
          {
            id: 'o1',
            // Same person, register spelling has no diacritics.
            displayName: person.displayName
              .normalize('NFD')
              .replace(/[̀-ͯ]/g, ''),
            kind: OwnerKind.PERSON,
            email: 'jan@example.com',
            hasAccount: true,
            katastrPersonId: null,
            ico: null,
          },
        ],
      },
      EFFECTIVE,
      NOW,
    );
    const owner = plan.owners[0];
    expect(owner.action).toBe('MATCHED_BY_NAME');
    expect(owner.existingOwnerId).toBe('o1');
    expect(owner.existingEmail).toBe('jan@example.com');
    expect(owner.existingHasAccount).toBe(true);
    expect(owner.backfillKatastrId).toBe(true);
    expect(plan.warnings).toContainEqual({
      code: 'NAME_MATCH',
      katastrPersonId: person.katastrPersonId,
      fileName: person.displayName,
      registerName: owner.existingDisplayName,
    });
  });

  it('does not match on name when both sides carry a different IČO', () => {
    const doc = document();
    const unit = doc.units.find(
      (u) => u.parties[0].members[0].ico === '250830',
    )!;
    const plan = buildImportPlan(
      { ...doc, units: [unit] },
      {
        units: [
          registerUnit({ unitNo: unit.unitNo, katastrUnitId: unit.katastrId }),
        ],
        owners: [
          {
            id: 'o1',
            displayName: 'Město Volary',
            kind: OwnerKind.LEGAL_ENTITY,
            email: null,
            hasAccount: false,
            katastrPersonId: null,
            ico: '99999999',
          },
        ],
      },
      EFFECTIVE,
      NOW,
    );
    expect(plan.owners[0].action).toBe('CREATE');
    expect(plan.blockers).toEqual([]);
  });

  it('matches an owner by IČO when exactly one register owner carries it', () => {
    const doc = document();
    const unit = doc.units.find(
      (u) => u.parties[0].members[0].ico === '250830',
    )!;
    const person = unit.parties[0].members[0];
    const plan = buildImportPlan(
      { ...doc, units: [unit] },
      {
        units: [
          registerUnit({ unitNo: unit.unitNo, katastrUnitId: unit.katastrId }),
        ],
        owners: [
          {
            id: 'o1',
            // Deliberately not the file's spelling — the match is on IČO,
            // not name.
            displayName: 'Obec Volary',
            kind: OwnerKind.LEGAL_ENTITY,
            email: 'obec@example.com',
            hasAccount: true,
            katastrPersonId: null,
            ico: '250830',
          },
        ],
      },
      EFFECTIVE,
      NOW,
    );
    const owner = plan.owners.find(
      (o) => o.katastrPersonId === person.katastrPersonId,
    )!;
    expect(owner.action).toBe('MATCHED_BY_ICO');
    expect(owner.existingOwnerId).toBe('o1');
    expect(owner.existingEmail).toBe('obec@example.com');
    expect(owner.existingHasAccount).toBe(true);
    expect(plan.blockers).toEqual([]);
  });

  it('does not match by name an owner that already carries a different cadastre id', () => {
    // Guard 1: byName is built only from owners with a null katastrPersonId.
    // An owner who already has *some other* katastr id is a matched, known
    // person — a same-looking name must not fold them into a new import.
    const doc = oneUnitDoc();
    const person = doc.units[0].parties[0].members[0];
    const plan = buildImportPlan(
      doc,
      {
        units: [],
        owners: [
          {
            id: 'o1',
            displayName: person.displayName,
            kind: OwnerKind.PERSON,
            email: null,
            hasAccount: false,
            katastrPersonId: `${person.katastrPersonId}-someone-else`,
            ico: null,
          },
        ],
      },
      EFFECTIVE,
      NOW,
    );
    const owner = plan.owners.find(
      (o) => o.katastrPersonId === person.katastrPersonId,
    )!;
    expect(owner.action).toBe('CREATE');
    expect(owner.existingOwnerId).toBeNull();
    expect(plan.blockers).toEqual([]);
  });

  it('blocks when two file people share a name with one nameable register owner', () => {
    // Guard 2: two katastr person ids resolving to the same register owner
    // (who has no katastr id of their own to disambiguate by) is exactly as
    // ambiguous as one person matching two owners — caught by the
    // claimedOwnerIds pass, not by the per-person candidate-count check.
    const doc = oneUnitDoc();
    const unit = doc.units[0];
    const person = unit.parties[0].members[0];
    const twinPerson: KatastrPerson = {
      katastrPersonId: `${person.katastrPersonId}-twin`,
      displayName: person.displayName,
      ico: null,
    };
    const twinParty: KatastrParty = {
      katastrSubjectId: `${unit.parties[0].katastrSubjectId}-twin`,
      type: 'OFO',
      share: unit.parties[0].share,
      members: [twinPerson],
    };
    const twoPersonDoc: KatastrDocument = {
      ...doc,
      units: [{ ...unit, parties: [...unit.parties, twinParty] }],
    };

    const plan = buildImportPlan(
      twoPersonDoc,
      {
        units: [],
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
        ],
      },
      EFFECTIVE,
      NOW,
    );

    expect(plan.blockers).toContainEqual({
      code: 'AMBIGUOUS_NAME',
      name: person.displayName,
      registerOwnerIds: ['o1'],
      katastrPersonIds: [person.katastrPersonId, twinPerson.katastrPersonId],
    });
    expect(plan.owners.map((o) => o.katastrPersonId)).toEqual(
      expect.arrayContaining([
        person.katastrPersonId,
        twinPerson.katastrPersonId,
      ]),
    );
  });

  it('blocks two file people sharing an IČO that both resolve to one unclaimed register owner, as AMBIGUOUS_ICO not AMBIGUOUS_NAME', () => {
    // The IČO-path sibling of the name-path test above: the collision here
    // is on IČO, so the report must say so — mislabeling it AMBIGUOUS_NAME
    // would send the admin to go check names, which is not where the clash
    // is. Both file people are individually an unambiguous single-candidate
    // IČO match (so neither trips the per-person AMBIGUOUS_ICO check above);
    // the ambiguity only exists in the pair.
    const doc = document();
    const unit = doc.units.find(
      (u) => u.parties[0].members[0].ico === '250830',
    )!;
    const person = unit.parties[0].members[0];
    const twinPerson: KatastrPerson = {
      katastrPersonId: `${person.katastrPersonId}-twin`,
      displayName: 'A Different Name Entirely',
      ico: person.ico,
    };
    const twinParty: KatastrParty = {
      katastrSubjectId: `${unit.parties[0].katastrSubjectId}-twin`,
      type: 'OFO',
      share: unit.parties[0].share,
      members: [twinPerson],
    };
    const twoPersonDoc: KatastrDocument = {
      ...doc,
      units: [{ ...unit, parties: [...unit.parties, twinParty] }],
    };

    const plan = buildImportPlan(
      twoPersonDoc,
      {
        units: [],
        owners: [
          {
            id: 'o1',
            displayName: 'Register Spelling, Irrelevant Here',
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
        registerOwnerIds: ['o1'],
        katastrPersonIds: [person.katastrPersonId, twinPerson.katastrPersonId],
      },
    ]);
  });

  describe('mixed-path double-claims', () => {
    // A double-claim need not arrive through one path: one document person
    // can be matched by IČO while another matches the same row by name (or,
    // once a prior import has backfilled both columns onto one row, by
    // cadastre id). Gating detection on a single path's own claim count
    // missed these entirely, rather than mislabelling them — a bug worse
    // than the one this file's other mixed-path predecessor test caught.

    /**
     * Every katastrPersonId named across all of an owner's blockers,
     * flattened and order-independent — the completeness check every test
     * below runs, not just "did it block". A blocker that fires but omits a
     * real contender (e.g. a cadastre-id-matched claimant riding alongside
     * an IČO clash) sends the admin looking for a duplicate they cannot
     * find under the code that actually fired.
     */
    const namedClaimants = (blockers: ImportPlan['blockers']): string[] =>
      blockers
        .flatMap((b) => ('katastrPersonIds' in b ? b.katastrPersonIds : []))
        .sort();

    it('blocks one claim via IČO and one via name landing on the same register owner', () => {
      const doc = document();
      const unit = doc.units.find(
        (u) => u.parties[0].members[0].ico === '250830',
      )!;
      const person = unit.parties[0].members[0];
      const twinPerson: KatastrPerson = {
        katastrPersonId: `${person.katastrPersonId}-twin`,
        displayName: 'Shared Display Name',
        ico: null,
      };
      const twinParty: KatastrParty = {
        katastrSubjectId: `${unit.parties[0].katastrSubjectId}-twin`,
        type: 'OFO',
        share: unit.parties[0].share,
        members: [twinPerson],
      };
      const twoPersonDoc: KatastrDocument = {
        ...doc,
        units: [{ ...unit, parties: [...unit.parties, twinParty] }],
      };

      const plan = buildImportPlan(
        twoPersonDoc,
        {
          units: [],
          owners: [
            {
              id: 'o1',
              // Matches twinPerson by name and person by IČO — both claims
              // land on this one, otherwise-unclaimed row.
              displayName: 'Shared Display Name',
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
          registerOwnerIds: ['o1'],
          katastrPersonIds: [person.katastrPersonId],
        },
        {
          code: 'AMBIGUOUS_NAME',
          name: 'Shared Display Name',
          registerOwnerIds: ['o1'],
          katastrPersonIds: [twinPerson.katastrPersonId],
        },
      ]);
      expect(namedClaimants(plan.blockers)).toEqual(
        [person.katastrPersonId, twinPerson.katastrPersonId].sort(),
      );
    });

    it('blocks one claim via cadastre person id and one via IČO — the routine second-import shape', () => {
      // A previously-matched owner commonly carries both katastr_person_id
      // and ico (backfilled by the import that first matched it). On a
      // later import, one document person can hit this row by cadastre id
      // while a different document person hits the same row by IČO.
      const doc = document();
      const unit = doc.units.find(
        (u) => u.parties[0].members[0].ico === '250830',
      )!;
      const person = unit.parties[0].members[0];
      const returningPerson: KatastrPerson = {
        katastrPersonId: 'already-known-cadastre-id',
        displayName: 'Returning Owner Spelling',
        ico: null,
      };
      const returningParty: KatastrParty = {
        katastrSubjectId: `${unit.parties[0].katastrSubjectId}-returning`,
        type: 'OFO',
        share: unit.parties[0].share,
        members: [returningPerson],
      };
      const twoPersonDoc: KatastrDocument = {
        ...doc,
        units: [{ ...unit, parties: [...unit.parties, returningParty] }],
      };

      const plan = buildImportPlan(
        twoPersonDoc,
        {
          units: [],
          owners: [
            {
              id: 'o1',
              displayName: 'Register Spelling, Irrelevant Here',
              kind: OwnerKind.LEGAL_ENTITY,
              email: null,
              hasAccount: false,
              // Already carries both columns, as a prior import's backfill
              // would leave it.
              katastrPersonId: 'already-known-cadastre-id',
              ico: person.ico,
            },
          ],
        },
        EFFECTIVE,
        NOW,
      );

      // No code fires "ambiguous by cadastre id" on its own (there is none
      // — that path can never be ambiguous by itself), but the returning
      // owner is still one of the two real-world subjects contending for
      // this row, so the one blocker that does fire must name them too —
      // a blocker naming only the IČO claimant would send the chair
      // searching the file for a duplicate IČO they will never find.
      expect(plan.blockers).toEqual([
        {
          code: 'AMBIGUOUS_ICO',
          ico: person.ico,
          registerOwnerIds: ['o1'],
          katastrPersonIds: [
            person.katastrPersonId,
            returningPerson.katastrPersonId,
          ],
        },
      ]);
      expect(namedClaimants(plan.blockers)).toEqual(
        [person.katastrPersonId, returningPerson.katastrPersonId].sort(),
      );
    });

    it('blocks a three-way claim split 1 IČO / 2 name, naming every claimant across the two blockers', () => {
      const doc = document();
      const unit = doc.units.find(
        (u) => u.parties[0].members[0].ico === '250830',
      )!;
      const person = unit.parties[0].members[0];
      const twinPersonA: KatastrPerson = {
        katastrPersonId: `${person.katastrPersonId}-twinA`,
        displayName: 'Shared Display Name',
        ico: null,
      };
      const twinPersonB: KatastrPerson = {
        katastrPersonId: `${person.katastrPersonId}-twinB`,
        displayName: 'Shared Display Name',
        ico: null,
      };
      const twinPartyA: KatastrParty = {
        katastrSubjectId: `${unit.parties[0].katastrSubjectId}-twinA`,
        type: 'OFO',
        share: unit.parties[0].share,
        members: [twinPersonA],
      };
      const twinPartyB: KatastrParty = {
        katastrSubjectId: `${unit.parties[0].katastrSubjectId}-twinB`,
        type: 'OFO',
        share: unit.parties[0].share,
        members: [twinPersonB],
      };
      const threePersonDoc: KatastrDocument = {
        ...doc,
        units: [
          { ...unit, parties: [...unit.parties, twinPartyA, twinPartyB] },
        ],
      };

      const plan = buildImportPlan(
        threePersonDoc,
        {
          units: [],
          owners: [
            {
              id: 'o1',
              displayName: 'Shared Display Name',
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
          registerOwnerIds: ['o1'],
          katastrPersonIds: [person.katastrPersonId],
        },
        {
          code: 'AMBIGUOUS_NAME',
          name: 'Shared Display Name',
          registerOwnerIds: ['o1'],
          katastrPersonIds: [
            twinPersonA.katastrPersonId,
            twinPersonB.katastrPersonId,
          ],
        },
      ]);
      // Every claimant is named somewhere — none silently dropped from every
      // payload, which is the Minor this gating fix also resolves.
      expect(namedClaimants(plan.blockers)).toEqual(
        [
          person.katastrPersonId,
          twinPersonA.katastrPersonId,
          twinPersonB.katastrPersonId,
        ].sort(),
      );
    });
  });

  it('warns instead of reclassifying when the kind disagrees', () => {
    const doc = document();
    const unit = doc.units.find(
      (u) => u.parties[0].members[0].ico === '250830',
    )!;
    const person = unit.parties[0].members[0];
    const plan = buildImportPlan(
      { ...doc, units: [unit] },
      {
        units: [
          registerUnit({ unitNo: unit.unitNo, katastrUnitId: unit.katastrId }),
        ],
        owners: [
          {
            id: 'o1',
            displayName: 'Město Volary',
            kind: OwnerKind.PERSON,
            email: null,
            hasAccount: false,
            katastrPersonId: person.katastrPersonId,
            ico: null,
          },
        ],
      },
      EFFECTIVE,
      NOW,
    );
    expect(plan.owners[0].action).toBe('MATCHED_BY_KATASTR_ID');
    expect(plan.warnings).toContainEqual({
      code: 'KIND_MISMATCH',
      katastrPersonId: person.katastrPersonId,
      registerKind: OwnerKind.PERSON,
      fileKind: OwnerKind.LEGAL_ENTITY,
    });
  });

  it('lists a register unit absent from the file without removing it', () => {
    const doc = oneUnitDoc();
    const plan = buildImportPlan(
      doc,
      {
        units: [
          registerUnit({ katastrUnitId: doc.units[0].katastrId }),
          registerUnit({ id: 'u2', unitNo: '131/1' }),
        ],
        owners: [],
      },
      EFFECTIVE,
      NOW,
    );
    expect(plan.unitsNotInFile).toEqual([{ unitId: 'u2', unitNo: '131/1' }]);
    expect(plan.units).toHaveLength(1);
  });
});

describe('buildImportPlan — snapshot order independence', () => {
  // buildImportPlan is a pure function: derived arrays whose order used to
  // follow whatever order the snapshot rows arrived in (unitsNotInFile,
  // ownersNotInFile, and AMBIGUOUS_NAME.registerOwnerIds) must not change the
  // plan hash just because the snapshot reader (a real repository, a test
  // fake, a future snapshot source) handed rows back in a different order.
  it('produces an identical plan hash for a snapshot and its reverse', () => {
    const doc = document();
    const unit = doc.units.find((u) => u.unitNo === '132/1')!;
    const person = unit.parties[0].members[0];
    const single: KatastrDocument = { ...doc, units: [unit] };

    const registerUnit = (id: string, unitNo: string) => ({
      id,
      unitNo,
      katastrUnitId: null,
      buildingShare: { num: 1n, den: 1n },
      usageCode: '1',
      usageName: 'byt',
      parties: [],
    });

    // Two register owners share the file person's exact name with no IČO on
    // either side to disambiguate — the "more than one candidate" AMBIGUOUS_NAME
    // shape (distinct from the single-candidate shape the other AMBIGUOUS_NAME
    // test already covers), so registerOwnerIds actually has an order to
    // exercise. Two further owners, and two further units, are unrelated to
    // the file and so land in ownersNotInFile / unitsNotInFile.
    const owners: RegisterSnapshot['owners'] = [
      {
        id: 'o-zzz',
        displayName: person.displayName,
        kind: OwnerKind.PERSON,
        email: null,
        hasAccount: false,
        katastrPersonId: null,
        ico: null,
      },
      {
        id: 'o-aaa',
        displayName: person.displayName,
        kind: OwnerKind.PERSON,
        email: null,
        hasAccount: false,
        katastrPersonId: null,
        ico: null,
      },
      {
        id: 'o-other-zzz',
        displayName: 'Zzz Not In File',
        kind: OwnerKind.PERSON,
        email: null,
        hasAccount: false,
        katastrPersonId: 'not-in-file-1',
        ico: null,
      },
      {
        id: 'o-other-aaa',
        displayName: 'Aaa Not In File',
        kind: OwnerKind.PERSON,
        email: null,
        hasAccount: false,
        katastrPersonId: 'not-in-file-2',
        ico: null,
      },
    ];
    const units: RegisterSnapshot['units'] = [
      registerUnit('u-zzz', 'Z-not-in-file'),
      registerUnit('u-aaa', 'A-not-in-file'),
    ];

    const forward = buildImportPlan(single, { units, owners }, EFFECTIVE, NOW);
    const reversed = buildImportPlan(
      single,
      { units: [...units].reverse(), owners: [...owners].reverse() },
      EFFECTIVE,
      NOW,
    );

    // Sanity: the derived arrays are sorted to a fixed order regardless of
    // input order — otherwise an equal hash below would prove nothing.
    expect(forward.unitsNotInFile.map((u) => u.unitNo)).toEqual([
      'A-not-in-file',
      'Z-not-in-file',
    ]);
    expect(forward.ownersNotInFile.map((o) => o.ownerId)).toEqual(
      expect.arrayContaining(['o-aaa', 'o-zzz', 'o-other-aaa', 'o-other-zzz']),
    );
    expect(forward.blockers).toContainEqual(
      expect.objectContaining({
        code: 'AMBIGUOUS_NAME',
        registerOwnerIds: ['o-aaa', 'o-zzz'],
      }),
    );
    expect(forward.unitsNotInFile).toEqual(reversed.unitsNotInFile);
    expect(forward.ownersNotInFile).toEqual(reversed.ownersNotInFile);
    expect(forward.blockers).toEqual(reversed.blockers);

    expect(computePlanHash('<xml/>', forward)).toBe(
      computePlanHash('<xml/>', reversed),
    );
  });

  it('produces an identical plan hash for two owners sharing an IČO, forward and reversed', () => {
    // owners.ico carries no unique constraint, so this snapshot shape is
    // reachable in production; without the grouped byIco map (rather than a
    // last-one-wins Map keyed by ico) this test would show a different
    // AMBIGUOUS_ICO.registerOwnerIds order and thus a different hash
    // depending only on which owner row the database happened to return
    // last — a spurious 409 on apply, or worse, a person id backfilled onto
    // the wrong owner row.
    const doc = document();
    const unit = doc.units.find(
      (u) => u.parties[0].members[0].ico === '250830',
    )!;
    const single: KatastrDocument = { ...doc, units: [unit] };

    const owners: RegisterSnapshot['owners'] = [
      {
        id: 'o-zzz',
        displayName: 'Zzz Company',
        kind: OwnerKind.LEGAL_ENTITY,
        email: null,
        hasAccount: false,
        katastrPersonId: null,
        ico: '250830',
      },
      {
        id: 'o-aaa',
        displayName: 'Aaa Company',
        kind: OwnerKind.LEGAL_ENTITY,
        email: null,
        hasAccount: false,
        katastrPersonId: null,
        ico: '250830',
      },
    ];

    const forward = buildImportPlan(
      single,
      { units: [], owners },
      EFFECTIVE,
      NOW,
    );
    const reversed = buildImportPlan(
      single,
      { units: [], owners: [...owners].reverse() },
      EFFECTIVE,
      NOW,
    );

    expect(forward.blockers).toContainEqual(
      expect.objectContaining({
        code: 'AMBIGUOUS_ICO',
        ico: '250830',
        registerOwnerIds: ['o-aaa', 'o-zzz'],
      }),
    );
    expect(forward.blockers).toEqual(reversed.blockers);

    expect(computePlanHash('<xml/>', forward)).toBe(
      computePlanHash('<xml/>', reversed),
    );
  });

  it("sorts a register unit's concurrent same-validFrom parties and their members deterministically", () => {
    // Two active parties on one register unit sharing an identical
    // validFrom — not an edge case: every replace-unit-ownership write gives
    // all the parties it creates the same validFrom, and the sample extract
    // has units with more than one concurrent party. unitId+validFrom alone
    // does not disambiguate them, which is exactly the gap the previous round
    // of this fix missed: ownershipChange.from (built from existing.parties)
    // and each party's memberNames are part of the plan and so part of the
    // hash, the same as unitsNotInFile/ownersNotInFile/registerOwnerIds.
    const doc = document();
    const unit = doc.units.find((u) => u.unitNo === '132/1')!;
    const single: KatastrDocument = { ...doc, units: [unit] };
    const validFrom = new Date('2020-01-01T00:00:00Z');

    const party = (
      id: string,
      memberOwnerIds: string[],
    ): RegisterSnapshot['units'][0]['parties'][0] => ({
      id,
      tenantId: 't',
      unitId: 'u1',
      partyType: OwnershipPartyType.SOLE,
      shareNumerator: 1,
      shareDenominator: 2,
      validFrom,
      validTo: null,
      memberOwnerIds,
    });

    const registerUnitWithParties = (
      parties: RegisterSnapshot['units'][0]['parties'],
    ): RegisterSnapshot['units'][0] => ({
      id: 'u1',
      // Deliberately not '132/1', so the only match is by katastrUnitId —
      // isolates this test from the unitsNotInFile/unitNo sort covered above.
      unitNo: '999/9',
      katastrUnitId: unit.katastrId,
      buildingShare: { num: 1n, den: 1n },
      usageCode: '1',
      usageName: 'byt',
      parties,
    });

    const partyA = party('party-a', ['member-a1', 'member-a2']);
    const partyB = party('party-b', ['member-b1', 'member-b2']);

    const forward = buildImportPlan(
      single,
      { units: [registerUnitWithParties([partyA, partyB])], owners: [] },
      EFFECTIVE,
      NOW,
    );
    const reversed = buildImportPlan(
      single,
      {
        units: [
          registerUnitWithParties([
            { ...partyB, memberOwnerIds: [...partyB.memberOwnerIds].reverse() },
            { ...partyA, memberOwnerIds: [...partyA.memberOwnerIds].reverse() },
          ]),
        ],
        owners: [],
      },
      EFFECTIVE,
      NOW,
    );

    const forwardChange = forward.units[0].ownershipChange;
    const reversedChange = reversed.units[0].ownershipChange;
    // Sanity: there really is a change to display (a null ownershipChange on
    // both sides would make an equal hash prove nothing), and the two
    // concurrent parties' member lists are non-trivial to compare.
    expect(forwardChange).not.toBeNull();
    expect(forwardChange?.from).toHaveLength(2);
    expect(forwardChange?.from.every((p) => p.memberNames.length === 2)).toBe(
      true,
    );
    expect(forwardChange).toEqual(reversedChange);

    expect(computePlanHash('<xml/>', forward)).toBe(
      computePlanHash('<xml/>', reversed),
    );
  });
});
