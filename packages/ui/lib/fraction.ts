export type Fraction = { num: number; den: number };

const gcd = (a: bigint, b: bigint): bigint => {
    let x = a < 0n ? -a : a;
    let y = b < 0n ? -b : b;
    while (y !== 0n) [x, y] = [y, x % y];
    return x === 0n ? 1n : x;
};

const fromBig = (num: bigint, den: bigint): Fraction => {
    const g = gcd(num, den);
    return { num: Number(num / g), den: Number(den / g) };
};

export function reduceFraction(f: Fraction): Fraction {
    return fromBig(BigInt(f.num), BigInt(f.den));
}

export function parseFraction(input: string): Fraction | null {
    const text = input.trim().replace(",", ".");
    if (/^\d+\/\d+$/.test(text)) {
        const [num, den] = text.split("/").map(Number);
        if (
            num <= 0 ||
            den <= 0 ||
            !Number.isSafeInteger(num) ||
            !Number.isSafeInteger(den)
        )
            return null;
        return reduceFraction({ num, den });
    }
    if (/^\d+$/.test(text)) {
        const num = Number(text);
        return num > 0 && Number.isSafeInteger(num) ? { num, den: 1 } : null;
    }
    if (/^\d*\.\d{1,8}$/.test(text)) {
        const [whole, frac] = text.split(".");
        const den = 10 ** frac.length;
        const num = Number(whole || "0") * den + Number(frac);
        return num > 0 ? reduceFraction({ num, den }) : null;
    }
    return null;
}

export function formatFraction(f: Fraction): string {
    return `${f.num}/${f.den}`;
}

export function sumFractions(fs: Fraction[]): Fraction {
    let num = 0n;
    let den = 1n;
    for (const f of fs) {
        num = num * BigInt(f.den) + BigInt(f.num) * den;
        den = den * BigInt(f.den);
        const g = gcd(num, den);
        num /= g;
        den /= g;
    }
    return fromBig(num, den);
}

export function fractionEqualsOne(f: Fraction): boolean {
    return f.num === f.den;
}

export function fractionToDecimalString(f: Fraction, dp = 4): string {
    const scale = 10n ** BigInt(dp);
    const scaled = (BigInt(f.num) * scale + BigInt(f.den) / 2n) / BigInt(f.den);
    const whole = scaled / scale;
    const frac = (scaled % scale).toString().padStart(dp, "0");
    return dp === 0 ? whole.toString() : `${whole}.${frac}`;
}

export function fractionToPercentString(f: Fraction, dp = 2): string {
    return `${fractionToDecimalString({ num: f.num * 100, den: f.den }, dp)} %`;
}

/**
 * Strips trailing fractional zeros (and a bare trailing ".") from a decimal
 * string, e.g. "50.00" -> "50", "66.67" is left alone, "12.50" -> "12.5".
 * Shared by fractionToTrimmedPercentString and any caller formatting a
 * plain (non-fraction) percent, such as pre-rounded decimal strings from
 * the API — so the trimming rule only lives in one place.
 */
export function trimTrailingZeros(decimal: string): string {
    if (!decimal.includes(".")) return decimal;
    return decimal.replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * Same BigInt-safe rounding as fractionToPercentString, but trims trailing
 * fractional zeros (and a bare trailing ".") instead of always padding to
 * `dp` places, and omits the " %" suffix. Use this for inline text where a
 * clean "50" / "66.67" reads better than "50.00" / "66.67", and the
 * surrounding copy (often an i18next string) supplies its own "%" sign —
 * see fractionToPercentString's own docstring-equivalent callers for the
 * padded, suffixed alternative.
 */
export function fractionToTrimmedPercentString(f: Fraction, dp = 2): string {
    return trimTrailingZeros(
        fractionToDecimalString({ num: f.num * 100, den: f.den }, dp),
    );
}
