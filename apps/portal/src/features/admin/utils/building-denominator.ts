/**
 * The denominator a house writes its shares over.
 *
 * Cadastre shares in one building are conventionally all expressed over the
 * same common denominator (`114/1332`, `86/1332`, …) rather than reduced, so
 * the denominator the existing units already agree on is the one a new unit
 * almost certainly wants. Picking the most common value rather than, say, the
 * first tolerates the odd unit that was entered over a different base.
 *
 * Ties go to the larger denominator: it expresses more distinct shares
 * exactly, so it is the safer default to offer.
 *
 * Returns `undefined` when there are no units yet — the house has not settled
 * on a denominator, so nothing should be suggested.
 */
export function mostCommonDenominator(
    units: { buildingShareDenominator: number }[],
): number | undefined {
    const counts = new Map<number, number>();
    for (const { buildingShareDenominator: den } of units) {
        if (!Number.isSafeInteger(den) || den <= 0) continue;
        counts.set(den, (counts.get(den) ?? 0) + 1);
    }

    let best: number | undefined;
    let bestCount = 0;
    for (const [den, count] of counts) {
        if (count > bestCount || (count === bestCount && den > (best ?? 0))) {
            best = den;
            bestCount = count;
        }
    }
    return best;
}
