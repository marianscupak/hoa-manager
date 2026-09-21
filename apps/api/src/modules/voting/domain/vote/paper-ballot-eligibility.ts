import { ElectorateIneligibleReason } from './vote.types';

/**
 * Ineligibilities a signed paper ballot cannot cure.
 *
 * A unit the association owns casts no vote at all, and a unit with no
 * ownership on record has nobody who could have signed the ballot.
 *
 * NO_REPRESENTATIVE is deliberately absent. The common representative is
 * what tells the app booth which account may cast for the unit, and
 * `resolveElectorateUnits` only considers memberships as candidates — so a
 * sole owner who simply has no user account lands here too. Paper ballots
 * exist for exactly those owners: the signer is an owner, checked against
 * the ownership register, not a membership. Mirrors `isRecordableAtAssembly`.
 *
 * The tally agrees: a ballot from such a unit counts, because `tally.ts`
 * weights every countable unit and only reports `eligibleWeight` separately.
 */
const UNCURABLE_ON_PAPER: (ElectorateIneligibleReason | null)[] = [
  ElectorateIneligibleReason.ASSOCIATION_OWNED,
  ElectorateIneligibleReason.MISSING_OWNERSHIP,
];

/** Whether the board may record a paper ballot for this unit. */
export function isRecordableOnPaper(
  ineligibleReason: ElectorateIneligibleReason | null,
): boolean {
  return !UNCURABLE_ON_PAPER.includes(ineligibleReason);
}
