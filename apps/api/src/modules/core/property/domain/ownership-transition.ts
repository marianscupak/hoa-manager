import { scheduledParties } from '@/modules/core/property/domain/ownership-periods';
import type { UnitOwnershipParty } from '@/modules/core/property/domain/property.entity';

export type OwnershipTransitionRejection =
  | 'TRANSFER_ALREADY_SCHEDULED'
  | 'EFFECTIVE_DATE_TOO_EARLY';

export type OwnershipTransitionPlan =
  | { kind: 'REJECT'; code: OwnershipTransitionRejection }
  | { kind: 'APPLY'; deletePartyIds: string[]; closePartyIds: string[] };

/**
 * Decides what replacing a unit's ownership at `effectiveAt` does to the
 * existing parties (spec §4.1):
 *
 * 1. a scheduled period exists                → REJECT TRANSFER_ALREADY_SCHEDULED
 * 2. effectiveAt precedes the latest period's start (or its end, when that
 *    period is already closed)                → REJECT EFFECTIVE_DATE_TOO_EARLY
 * 3. effectiveAt equals the latest start      → delete that period (same-day
 *    correction; closing would leave a zero-length ghost)
 * 4. otherwise close the still-open parties of the latest period at
 *    effectiveAt; a closed latest period is left alone (a gap stays a gap)
 *
 * Inserting the new parties is the caller's job.
 */
export function planOwnershipTransition(
  parties: UnitOwnershipParty[],
  effectiveAt: Date,
  now: Date,
): OwnershipTransitionPlan {
  if (scheduledParties(parties, now).length > 0) {
    return { kind: 'REJECT', code: 'TRANSFER_ALREADY_SCHEDULED' };
  }
  if (parties.length === 0) {
    return { kind: 'APPLY', deletePartyIds: [], closePartyIds: [] };
  }

  const latestFrom = Math.max(...parties.map((p) => p.validFrom.getTime()));
  const latest = parties.filter((p) => p.validFrom.getTime() === latestFrom);
  const e = effectiveAt.getTime();

  if (e < latestFrom) {
    return { kind: 'REJECT', code: 'EFFECTIVE_DATE_TOO_EARLY' };
  }
  const endsAfter = latest.some(
    (p) => p.validTo !== null && e < p.validTo.getTime(),
  );
  if (endsAfter) {
    return { kind: 'REJECT', code: 'EFFECTIVE_DATE_TOO_EARLY' };
  }
  if (e === latestFrom) {
    return {
      kind: 'APPLY',
      deletePartyIds: latest.map((p) => p.id),
      closePartyIds: [],
    };
  }
  return {
    kind: 'APPLY',
    deletePartyIds: [],
    closePartyIds: latest.filter((p) => p.validTo === null).map((p) => p.id),
  };
}
