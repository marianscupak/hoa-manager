import { ElectorateIneligibleReason } from './vote.types';

/**
 * Ineligibilities a meeting cannot cure.
 *
 * A unit the association owns casts no vote at all, and a unit with no
 * ownership on record has nobody who could have stood up in the room.
 *
 * NO_REPRESENTATIVE is deliberately absent. Needing a common representative
 * agreed in advance is a per-rollam requirement: at a meeting the co-owners
 * settle it in the room, often with a power of attorney handed over there. It
 * also catches a sole owner with no user account — `resolveElectorateUnits`
 * only considers memberships as candidates — which would otherwise make most
 * of a real building unrecordable.
 *
 * The tally agrees: a ballot from such a unit counts, because `tally.ts`
 * weights every countable unit and only reports `eligibleWeight` separately.
 */
const UNCURABLE_AT_A_MEETING: (ElectorateIneligibleReason | null)[] = [
  ElectorateIneligibleReason.ASSOCIATION_OWNED,
  ElectorateIneligibleReason.MISSING_OWNERSHIP,
];

/** Whether the board may record attendance and a ballot for this unit. */
export function isRecordableAtAssembly(
  ineligibleReason: ElectorateIneligibleReason | null,
): boolean {
  return !UNCURABLE_AT_A_MEETING.includes(ineligibleReason);
}
