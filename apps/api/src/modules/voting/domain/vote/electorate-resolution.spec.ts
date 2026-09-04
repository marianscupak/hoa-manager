import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';

import {
  applyHypotheticalConsent,
  resolveElectorateUnits,
  type ElectoratePartyInput,
} from './electorate-resolution';
import {
  ElectorateEligibilityStatus,
  ElectorateIneligibleReason,
  VoteWeightBasis,
} from './vote.types';

const UNIT = {
  id: 'u1',
  buildingShareNumerator: 1712,
  buildingShareDenominator: 10000,
};

const member = (
  ownerId: string,
  membershipId: string | null,
  ownerKind = OwnerKind.PERSON,
) => ({ ownerId, ownerKind, membershipId });

const sole = (
  ownerId: string,
  membershipId: string | null,
  num: number,
  den: number,
): ElectoratePartyInput => ({
  unitId: 'u1',
  partyType: OwnershipPartyType.SOLE,
  shareNumerator: num,
  shareDenominator: den,
  members: [member(ownerId, membershipId)],
});

const resolve = (
  parties: ElectoratePartyInput[],
  consents: { fromOwnerId: string; toMembershipId: string }[] = [],
) =>
  resolveElectorateUnits(
    [UNIT],
    parties,
    consents.map((c) => ({ ...c, unitId: 'u1' })),
    VoteWeightBasis.UNIT_SHARE,
  )[0];

describe('resolveElectorateUnits', () => {
  it('missing ownership → INELIGIBLE / MISSING_OWNERSHIP, weight still recorded', () => {
    const row = resolve([]);
    expect(row.eligibilityStatus).toBe(ElectorateEligibilityStatus.INELIGIBLE);
    expect(row.ineligibleReason).toBe(
      ElectorateIneligibleReason.MISSING_OWNERSHIP,
    );
    expect(row.weightNum).toBe(107); // 1712/10000 reduced
    expect(row.weightDen).toBe(625);
  });

  it('sole owner with account is auto-eligible', () => {
    const row = resolve([sole('p1', 'm1', 1, 1)]);
    expect(row.eligibilityStatus).toBe(ElectorateEligibilityStatus.ELIGIBLE);
    expect(row.representativeMembershipId).toBe('m1');
  });

  it('sole owner without account → NO_REPRESENTATIVE', () => {
    expect(resolve([sole('p1', null, 1, 1)]).ineligibleReason).toBe(
      ElectorateIneligibleReason.NO_REPRESENTATIVE,
    );
  });

  it('sole owner delegates: consent to board redirects the unit', () => {
    const row = resolve(
      [sole('p1', 'm1', 1, 1)],
      [{ fromOwnerId: 'p1', toMembershipId: 'board' }],
    );
    expect(row.eligibilityStatus).toBe(ElectorateEligibilityStatus.ELIGIBLE);
    expect(row.representativeMembershipId).toBe('board');
  });

  it('sole owner WITHOUT account delegates: board-recorded consent designates the delegate (§ 1185)', () => {
    const row = resolve(
      [sole('p1', null, 1, 1)],
      [{ fromOwnerId: 'p1', toMembershipId: 'board' }],
    );
    expect(row.eligibilityStatus).toBe(ElectorateEligibilityStatus.ELIGIBLE);
    expect(row.representativeMembershipId).toBe('board');
  });

  it('60/40 co-owners: majority holder designates without minority consent', () => {
    const row = resolve([sole('p1', 'm1', 3, 5), sole('p2', 'm2', 2, 5)]);
    expect(row.representativeMembershipId).toBe('m1'); // p1 alone holds > 1/2
  });

  it('50/50 deadlock → NO_REPRESENTATIVE', () => {
    expect(
      resolve([sole('p1', 'm1', 1, 2), sole('p2', 'm2', 1, 2)])
        .ineligibleReason,
    ).toBe(ElectorateIneligibleReason.NO_REPRESENTATIVE);
  });

  it('50/50 resolved by consent: p2 consents to m1 → m1 holds 1/1 > 1/2', () => {
    const row = resolve(
      [sole('p1', 'm1', 1, 2), sole('p2', 'm2', 1, 2)],
      [{ fromOwnerId: 'p2', toMembershipId: 'm1' }],
    );
    expect(row.representativeMembershipId).toBe('m1');
    expect(row.eligibilityStatus).toBe(ElectorateEligibilityStatus.ELIGIBLE);
  });

  it('exactly 1/2 consented is NOT a majority (strict >1/2)', () => {
    const row = resolve(
      [
        sole('p1', 'm1', 1, 4),
        sole('p2', 'm2', 1, 4),
        sole('p3', 'm3', 1, 4),
        sole('p4', 'm4', 1, 4),
      ],
      [{ fromOwnerId: 'p2', toMembershipId: 'm1' }],
    );
    expect(row.ineligibleReason).toBe(
      ElectorateIneligibleReason.NO_REPRESENTATIVE,
    );
  });

  it('SJM 1/1 is NOT auto-eligible; the other spouse designates', () => {
    const sjm: ElectoratePartyInput = {
      unitId: 'u1',
      partyType: OwnershipPartyType.SJM,
      shareNumerator: 1,
      shareDenominator: 1,
      members: [member('wife', 'mw'), member('husband', 'mh')],
    };
    expect(resolve([sjm]).ineligibleReason).toBe(
      ElectorateIneligibleReason.NO_REPRESENTATIVE,
    );
    const designated = resolve(
      [sjm],
      [{ fromOwnerId: 'husband', toMembershipId: 'mw' }],
    );
    expect(designated.representativeMembershipId).toBe('mw');
  });

  it('third-party representative: all owners consent to a non-owner membership', () => {
    const row = resolve(
      [sole('p1', 'm1', 1, 2), sole('p2', null, 1, 2)],
      [
        { fromOwnerId: 'p1', toMembershipId: 'board' },
        { fromOwnerId: 'p2', toMembershipId: 'board' },
      ],
    );
    expect(row.representativeMembershipId).toBe('board');
  });

  it('association-owned unit → ASSOCIATION_OWNED', () => {
    const assoc: ElectoratePartyInput = {
      unitId: 'u1',
      partyType: OwnershipPartyType.SOLE,
      shareNumerator: 1,
      shareDenominator: 1,
      members: [member('svj', 'svj-m', OwnerKind.ASSOCIATION)],
    };
    expect(resolve([assoc]).ineligibleReason).toBe(
      ElectorateIneligibleReason.ASSOCIATION_OWNED,
    );
  });

  it('explicit consent overrides implicit self-support (deterministic winner)', () => {
    const row = resolve(
      [sole('p1', 'mA', 3, 5), sole('p2', 'mB', 2, 5)],
      [{ fromOwnerId: 'p1', toMembershipId: 'mB' }],
    );
    expect(row.representativeMembershipId).toBe('mB');
  });

  it('mutual cross-delegation resolves to the majority-backed delegate', () => {
    const row = resolve(
      [sole('p1', 'mA', 3, 5), sole('p2', 'mB', 2, 5)],
      [
        { fromOwnerId: 'p1', toMembershipId: 'mB' },
        { fromOwnerId: 'p2', toMembershipId: 'mA' },
      ],
    );
    expect(row.representativeMembershipId).toBe('mB');
  });

  it('ONE_UNIT_ONE_VOTE weights every unit 1/1', () => {
    const row = resolveElectorateUnits(
      [UNIT],
      [{ ...sole('p1', 'm1', 1, 1) }],
      [],
      VoteWeightBasis.ONE_UNIT_ONE_VOTE,
    )[0];
    expect(row.weightNum).toBe(1);
    expect(row.weightDen).toBe(1);
  });
});

describe('applyHypotheticalConsent', () => {
  const existing = [
    { unitId: 'u1', fromOwnerId: 'wife', toMembershipId: 'mh' },
    { unitId: 'u1', fromOwnerId: 'neighbour', toMembershipId: 'board' },
    { unitId: 'u2', fromOwnerId: 'wife', toMembershipId: 'board' },
  ];

  it('replaces the consent the owner already recorded for that unit', () => {
    expect(
      applyHypotheticalConsent(existing, {
        unitId: 'u1',
        fromOwnerId: 'wife',
        toMembershipId: 'board',
      }),
    ).toEqual([
      { unitId: 'u1', fromOwnerId: 'neighbour', toMembershipId: 'board' },
      { unitId: 'u2', fromOwnerId: 'wife', toMembershipId: 'board' },
      { unitId: 'u1', fromOwnerId: 'wife', toMembershipId: 'board' },
    ]);
  });

  it('adds the consent when the owner has none for that unit', () => {
    expect(
      applyHypotheticalConsent(existing, {
        unitId: 'u1',
        fromOwnerId: 'husband',
        toMembershipId: 'board',
      }),
    ).toHaveLength(4);
  });

  it('leaves the caller-supplied list untouched', () => {
    const before = [...existing];
    applyHypotheticalConsent(existing, {
      unitId: 'u1',
      fromOwnerId: 'wife',
      toMembershipId: 'board',
    });
    expect(existing).toEqual(before);
  });

  it('a replaced consent does not let one owner back two candidates', () => {
    const sjm: ElectoratePartyInput = {
      unitId: 'u1',
      partyType: OwnershipPartyType.SJM,
      shareNumerator: 1,
      shareDenominator: 1,
      members: [member('wife', 'mw'), member('husband', 'mh')],
    };
    // The husband has designated his wife, so the unit can vote. If she now
    // consents to the board, her self-support is gone and the husband still
    // backs only her: the unit ends up with nobody.
    const row = resolveElectorateUnits(
      [UNIT],
      [sjm],
      applyHypotheticalConsent(
        [{ unitId: 'u1', fromOwnerId: 'husband', toMembershipId: 'mw' }],
        { unitId: 'u1', fromOwnerId: 'wife', toMembershipId: 'board' },
      ),
      VoteWeightBasis.UNIT_SHARE,
    )[0];
    expect(row.ineligibleReason).toBe(
      ElectorateIneligibleReason.NO_REPRESENTATIVE,
    );
  });
});
