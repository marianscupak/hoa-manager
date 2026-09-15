import { fractionToTrimmedPercentString } from "@hoa-mngr/ui";

import type { FractionDto, VoteTallyOptionDto } from "@/api/generated/model";

export interface TallyDisplay {
    /** The figure shown large. Null when no countable ballot exists yet and a
     *  percentage would be meaningless. */
    primary: string | null;
    /** The supporting unit count, or null when the count is already primary. */
    secondary: number | null;
}

function gcd(a: bigint, b: bigint): bigint {
    let x = a < 0n ? -a : a;
    let y = b < 0n ? -b : b;
    while (y !== 0n) [x, y] = [y, x % y];
    return x === 0n ? 1n : x;
}

/**
 * `weight / denominator`, computed exactly by cross-multiplying the DTO's
 * exact `num`/`den` strings as BigInt — never the pre-rounded `decimal`
 * fields (each already rounded to 4 places), whose raw float division can
 * land off an exact value: 1/24 over 1/12 is exactly 50 %, but
 * 0.0417 / 0.0833 × 100 is 50.06. Reduced via GCD before the final
 * conversion down to `Number`, so the pair handed to
 * `fractionToTrimmedPercentString` (which is `{num: number, den: number}`,
 * not bigint) stays a safe integer even for large share denominators.
 */
function divideFractions(
    weight: FractionDto,
    denominator: FractionDto,
): { num: number; den: number } {
    const num = BigInt(weight.num) * BigInt(denominator.den);
    const den = BigInt(weight.den) * BigInt(denominator.num);
    const g = gcd(num, den);
    return { num: Number(num / g), den: Number(den / g) };
}

/**
 * A share-weighted vote is decided by building shares, so leading with plain
 * unit counts could point the opposite way from the eventual result. The
 * share is measured against the question's own majority denominator — the
 * same basis the final verdict uses — so the provisional figure is directly
 * comparable to the threshold.
 */
export function formatTallyOption(
    option: VoteTallyOptionDto,
    majorityDenominator: FractionDto,
    weightBasis: "UNIT_SHARE" | "ONE_UNIT_ONE_VOTE",
): TallyDisplay {
    if (weightBasis === "ONE_UNIT_ONE_VOTE") {
        return { primary: String(option.voteUnitCount), secondary: null };
    }

    // A zero numerator is the exact "no countable ballots yet" case — tested
    // on the numerator itself rather than the rounded `decimal`, which a
    // tiny-but-nonzero denominator could round down to "0.0000" and suppress
    // wrongly.
    if (BigInt(majorityDenominator.num) === 0n) {
        return { primary: null, secondary: option.voteUnitCount };
    }

    // fractionToTrimmedPercentString already trims trailing zeros, so a
    // clean 50 renders as "50", not "50.00" — " %" restores the house-style
    // spaced sign that formatPercent produces elsewhere.
    const share = divideFractions(option.voteWeight, majorityDenominator);
    return {
        primary: `${fractionToTrimmedPercentString(share, 2)} %`,
        secondary: option.voteUnitCount,
    };
}
