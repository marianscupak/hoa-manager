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
  memberRef,
  ownerRef,
  type RepresentativeRef,
} from './representative-ref';
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
  consents: { fromOwnerId: string; to: RepresentativeRef }[] = [],
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

  it('sole owner with account is auto-eligible as their own representative', () => {
    const row = resolve([sole('p1', 'm1', 1, 1)]);
    expect(row.eligibilityStatus).toBe(ElectorateEligibilityStatus.ELIGIBLE);
    expect(row.representativeOwnerId).toBe('p1');
    expect(row.representativeMembershipId).toBeNull();
  });

  it('sole owner WITHOUT account is eligible too — the account is a channel, not a right', () => {
    const row = resolve([sole('p1', null, 1, 1)]);
    expect(row.eligibilityStatus).toBe(ElectorateEligibilityStatus.ELIGIBLE);
    expect(row.representativeOwnerId).toBe('p1');
    expect(row.ineligibleReason).toBeNull();
  });

  it('sole owner delegates: consent to a board member redirects the unit', () => {
    const row = resolve(
      [sole('p1', 'm1', 1, 1)],
      [{ fromOwnerId: 'p1', to: memberRef('board') }],
    );
    expect(row.eligibilityStatus).toBe(ElectorateEligibilityStatus.ELIGIBLE);
    expect(row.representativeOwnerId).toBeNull();
    expect(row.representativeMembershipId).toBe('board');
  });

  it('sole owner WITHOUT account delegates: board-recorded consent designates the delegate', () => {
    const row = resolve(
      [sole('p1', null, 1, 1)],
      [{ fromOwnerId: 'p1', to: memberRef('board') }],
    );
    expect(row.representativeMembershipId).toBe('board');
  });

  it('60/40 co-owners: majority holder designates without minority consent', () => {
    const row = resolve([sole('p1', 'm1', 3, 5), sole('p2', 'm2', 2, 5)]);
    expect(row.representativeOwnerId).toBe('p1');
  });

  it('50/50 deadlock → NO_REPRESENTATIVE', () => {
    expect(
      resolve([sole('p1', 'm1', 1, 2), sole('p2', 'm2', 1, 2)])
        .ineligibleReason,
    ).toBe(ElectorateIneligibleReason.NO_REPRESENTATIVE);
  });

  it('50/50 resolved by consent to the co-owner as a person', () => {
    const row = resolve(
      [sole('p1', 'm1', 1, 2), sole('p2', 'm2', 1, 2)],
      [{ fromOwnerId: 'p2', to: ownerRef('p1') }],
    );
    expect(row.representativeOwnerId).toBe('p1');
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
      [{ fromOwnerId: 'p2', to: ownerRef('p1') }],
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
      [{ fromOwnerId: 'husband', to: ownerRef('wife') }],
    );
    expect(designated.representativeOwnerId).toBe('wife');
  });

  it('SJM without any account: a consent to the spouse as an owner designates them', () => {
    const sjm: ElectoratePartyInput = {
      unitId: 'u1',
      partyType: OwnershipPartyType.SJM,
      shareNumerator: 1,
      shareDenominator: 1,
      members: [member('wife', null), member('husband', null)],
    };
    const row = resolve(
      [sjm],
      [{ fromOwnerId: 'wife', to: ownerRef('husband') }],
    );
    expect(row.eligibilityStatus).toBe(ElectorateEligibilityStatus.ELIGIBLE);
    expect(row.representativeOwnerId).toBe('husband');
    expect(row.representativeMembershipId).toBeNull();
  });

  it('third-party representative: all owners consent to a non-owner membership', () => {
    const row = resolve(
      [sole('p1', 'm1', 1, 2), sole('p2', null, 1, 2)],
      [
        { fromOwnerId: 'p1', to: memberRef('board') },
        { fromOwnerId: 'p2', to: memberRef('board') },
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
      [{ fromOwnerId: 'p1', to: ownerRef('p2') }],
    );
    expect(row.representativeOwnerId).toBe('p2');
  });

  it('mutual cross-delegation resolves to the majority-backed delegate', () => {
    const row = resolve(
      [sole('p1', 'mA', 3, 5), sole('p2', 'mB', 2, 5)],
      [
        { fromOwnerId: 'p1', to: ownerRef('p2') },
        { fromOwnerId: 'p2', to: ownerRef('p1') },
      ],
    );
    expect(row.representativeOwnerId).toBe('p2');
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
    { unitId: 'u1', fromOwnerId: 'wife', to: ownerRef('husband') },
    { unitId: 'u1', fromOwnerId: 'neighbour', to: memberRef('board') },
    { unitId: 'u2', fromOwnerId: 'wife', to: memberRef('board') },
  ];

  it('replaces the consent the owner already recorded for that unit', () => {
    expect(
      applyHypotheticalConsent(existing, {
        unitId: 'u1',
        fromOwnerId: 'wife',
        to: memberRef('board'),
      }),
    ).toEqual([
      { unitId: 'u1', fromOwnerId: 'neighbour', to: memberRef('board') },
      { unitId: 'u2', fromOwnerId: 'wife', to: memberRef('board') },
      { unitId: 'u1', fromOwnerId: 'wife', to: memberRef('board') },
    ]);
  });

  it('adds the consent when the owner has none for that unit', () => {
    expect(
      applyHypotheticalConsent(existing, {
        unitId: 'u1',
        fromOwnerId: 'husband',
        to: memberRef('board'),
      }),
    ).toHaveLength(4);
  });

  it('leaves the caller-supplied list untouched', () => {
    const before = [...existing];
    applyHypotheticalConsent(existing, {
      unitId: 'u1',
      fromOwnerId: 'wife',
      to: memberRef('board'),
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
        [{ unitId: 'u1', fromOwnerId: 'husband', to: ownerRef('wife') }],
        { unitId: 'u1', fromOwnerId: 'wife', to: memberRef('board') },
      ),
      VoteWeightBasis.UNIT_SHARE,
    )[0];
    expect(row.ineligibleReason).toBe(
      ElectorateIneligibleReason.NO_REPRESENTATIVE,
    );
  });
});
