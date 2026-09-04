/**
 * Share arithmetic for the owner-facing unit pages.
 *
 * Both a party's share of a unit and a unit's share of the building's
 * common parts are stored as fractions, which is how the cadastre and
 * the association's documents state them. The API also reports each one
 * as a percentage rounded to two decimals; these helpers work from the
 * fraction so a rounded value never drives a decision.
 */

/** The fraction as a percentage (0..100), unrounded. 0 if the denominator is missing. */
export function sharePercent(numerator: number, denominator: number): number {
    if (!denominator) return 0;
    return (numerator / denominator) * 100;
}

/**
 * Whether part of the unit belongs to somebody outside the caller's
 * party, i.e. the party holds less than the whole.
 *
 * Compared as a fraction on purpose: a third of a unit rounds to
 * 33.33 %, and no rounding step should be able to turn a partial share
 * into a whole one.
 *
 * A party held jointly by spouses holds one undivided share, which the
 * API reports in full rather than split between the two owners. Such a
 * party owning the whole unit therefore answers "no": nobody outside it
 * holds any part. That the unit is held jointly is stated where it
 * belongs, next to the two names on the unit's ownership table.
 */
export function isCoOwnedShare(
    numerator: number,
    denominator: number,
): boolean {
    if (!denominator) return false;
    return numerator < denominator;
}
