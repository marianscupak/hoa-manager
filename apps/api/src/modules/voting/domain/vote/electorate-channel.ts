import { type ElectoratePartyInput } from './electorate-resolution';
import { type ElectorateUnit } from './vote.types';

/**
 * Which account may cast for a unit **before** the vote opens, derived from
 * the same ownership parties the resolver saw: a non-owner delegate's stored
 * membership, else the membership linked to the owner-representative, else
 * nobody (paper only). The snapshot-phase twin lives in SQL —
 * `electorate-channel.sql.ts` — and must agree with this definition.
 */
export function channelMembershipIdFromParties(
  row: Pick<
    ElectorateUnit,
    'representativeOwnerId' | 'representativeMembershipId'
  >,
  parties: ElectoratePartyInput[],
): string | null {
  if (row.representativeMembershipId) return row.representativeMembershipId;
  if (!row.representativeOwnerId) return null;
  for (const party of parties) {
    for (const m of party.members) {
      if (m.ownerId === row.representativeOwnerId) return m.membershipId;
    }
  }
  return null;
}
