import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';

import { channelMembershipIdFromParties } from './electorate-channel';
import { type ElectoratePartyInput } from './electorate-resolution';

const party = (
  ownerId: string,
  membershipId: string | null,
): ElectoratePartyInput => ({
  unitId: 'u1',
  partyType: OwnershipPartyType.SOLE,
  shareNumerator: 1,
  shareDenominator: 2,
  members: [{ ownerId, ownerKind: OwnerKind.PERSON, membershipId }],
});

describe('channelMembershipIdFromParties', () => {
  const parties = [party('own-a', 'm-a'), party('own-b', null)];

  it('uses the stored membership for a non-owner delegate', () => {
    expect(
      channelMembershipIdFromParties(
        { representativeOwnerId: null, representativeMembershipId: 'board' },
        parties,
      ),
    ).toBe('board');
  });

  it('looks up the owner-representative’s membership among the parties', () => {
    expect(
      channelMembershipIdFromParties(
        { representativeOwnerId: 'own-a', representativeMembershipId: null },
        parties,
      ),
    ).toBe('m-a');
  });

  it('is null for an owner-representative without an account', () => {
    expect(
      channelMembershipIdFromParties(
        { representativeOwnerId: 'own-b', representativeMembershipId: null },
        parties,
      ),
    ).toBeNull();
  });

  it('is null when nobody represents the unit', () => {
    expect(
      channelMembershipIdFromParties(
        { representativeOwnerId: null, representativeMembershipId: null },
        parties,
      ),
    ).toBeNull();
  });
});
