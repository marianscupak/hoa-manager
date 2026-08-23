import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';

import {
  resolveElectorateUnits,
  type ElectoratePartyInput,
} from './electorate-resolution';
import { deriveOwningUnitStatus } from './owning-unit-status';
import {
  ElectorateEligibilityStatus,
  ElectorateIneligibleReason,
  OwningUnitStatus,
  VoteWeightBasis,
} from './vote.types';

/**
 * The pre-open preview and the open-time snapshot must designate the same
 * representative — these cases pin the mapping the voter-status read path
 * applies on top of `resolveElectorateUnits`.
 */
describe('deriveOwningUnitStatus', () => {
  const UNIT = {
    id: 'u1',
    buildingShareNumerator: 1,
    buildingShareDenominator: 4,
  };

  const party = (
    ownerId: string,
    membershipId: string,
    num: number,
    den: number,
  ): ElectoratePartyInput => ({
    unitId: 'u1',
    partyType: OwnershipPartyType.SOLE,
    shareNumerator: num,
    shareDenominator: den,
    members: [{ ownerId, ownerKind: OwnerKind.PERSON, membershipId }],
  });

  const preview = (
    parties: ElectoratePartyInput[],
    consents: { unitId: string; fromOwnerId: string; toMembershipId: string }[],
    membershipId: string,
  ) => {
    const [resolved] = resolveElectorateUnits(
      [UNIT],
      parties,
      consents,
      VoteWeightBasis.UNIT_SHARE,
    );
    return {
      resolved,
      status: deriveOwningUnitStatus({
        resolved,
        membershipId,
        hasVoted: false,
        phase: 'PREVIEW' as const,
      }),
    };
  };

  describe('60/40 co-ownership, no consents given', () => {
    const parties = [
      party('own-a', 'm-a', 60, 100),
      party('own-b', 'm-b', 40, 100),
    ];

    it('previews READY for the share-majority holder', () => {
      const { resolved, status } = preview(parties, [], 'm-a');

      expect(resolved.representativeMembershipId).toBe('m-a');
      expect(status).toBe(OwningUnitStatus.READY);
    });

    it('previews DELEGATED for the minority co-owner', () => {
      expect(preview(parties, [], 'm-b').status).toBe(
        OwningUnitStatus.DELEGATED,
      );
    });
  });

  it('previews REQUIRES_DELEGATION on an exactly-1/2 split (no majority)', () => {
    const parties = [party('own-a', 'm-a', 1, 2), party('own-b', 'm-b', 1, 2)];

    const { resolved, status } = preview(parties, [], 'm-a');

    expect(resolved.representativeMembershipId).toBeNull();
    expect(resolved.ineligibleReason).toBe(
      ElectorateIneligibleReason.NO_REPRESENTATIVE,
    );
    expect(status).toBe(OwningUnitStatus.REQUIRES_DELEGATION);
  });

  it('previews READY once the 1/2 deadlock is broken by a consent', () => {
    const parties = [party('own-a', 'm-a', 1, 2), party('own-b', 'm-b', 1, 2)];
    const consents = [
      { unitId: 'u1', fromOwnerId: 'own-b', toMembershipId: 'm-a' },
    ];

    expect(preview(parties, consents, 'm-a').status).toBe(
      OwningUnitStatus.READY,
    );
    expect(preview(parties, consents, 'm-b').status).toBe(
      OwningUnitStatus.DELEGATED,
    );
  });

  it('previews READY for a sole owner', () => {
    expect(preview([party('own-a', 'm-a', 1, 1)], [], 'm-a').status).toBe(
      OwningUnitStatus.READY,
    );
  });

  it('previews DELEGATED for a sole owner who delegated the unit', () => {
    const consents = [
      { unitId: 'u1', fromOwnerId: 'own-a', toMembershipId: 'm-x' },
    ];

    const { resolved, status } = preview(
      [party('own-a', 'm-a', 1, 1)],
      consents,
      'm-a',
    );

    expect(resolved.representativeMembershipId).toBe('m-x');
    expect(status).toBe(OwningUnitStatus.DELEGATED);

    // ...and the delegate genuinely holds the unit at open.
    expect(preview([party('own-a', 'm-a', 1, 1)], consents, 'm-x').status).toBe(
      OwningUnitStatus.READY,
    );
  });

  it('previews INELIGIBLE for a unit with no ownership on record', () => {
    const { resolved, status } = preview([], [], 'm-a');

    expect(resolved.ineligibleReason).toBe(
      ElectorateIneligibleReason.MISSING_OWNERSHIP,
    );
    expect(status).toBe(OwningUnitStatus.INELIGIBLE);
  });

  it('reports VOTED ahead of READY once a ballot exists', () => {
    const [resolved] = resolveElectorateUnits(
      [UNIT],
      [party('own-a', 'm-a', 1, 1)],
      [],
      VoteWeightBasis.UNIT_SHARE,
    );

    expect(
      deriveOwningUnitStatus({
        resolved,
        membershipId: 'm-a',
        hasVoted: true,
        phase: 'PREVIEW',
      }),
    ).toBe(OwningUnitStatus.VOTED);
  });

  describe('SNAPSHOT phase', () => {
    const frozen = {
      representativeMembershipId: null,
      eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
      ineligibleReason: ElectorateIneligibleReason.NO_REPRESENTATIVE,
    };

    it('reports INELIGIBLE, not REQUIRES_DELEGATION — the electorate is frozen', () => {
      expect(
        deriveOwningUnitStatus({
          resolved: frozen,
          membershipId: 'm-a',
          hasVoted: false,
          phase: 'SNAPSHOT',
        }),
      ).toBe(OwningUnitStatus.INELIGIBLE);
    });
  });
});
