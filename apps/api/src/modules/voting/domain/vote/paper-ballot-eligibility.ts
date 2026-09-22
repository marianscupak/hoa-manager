/**
 * Whether the board may record a paper ballot for this unit in a per-rollam
 * vote: only a unit with a designated representative. The representative
 * need not have an account — that is exactly who paper ballots are for — but
 * co-owners who never agreed on one cannot be cured by a signature; per
 * rollam the designation happens before the vote opens (see
 * `CreateVoteConsentHandler`).
 *
 * Contrast `isRecordableAtAssembly`, which tolerates NO_REPRESENTATIVE
 * because a meeting settles it in the room.
 */
export function isRecordableOnPaper(row: {
  eligibilityStatus: string;
}): boolean {
  return row.eligibilityStatus === 'ELIGIBLE';
}
