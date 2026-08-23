import { describe, expect, it } from "vitest";

import {
    parseFraction,
    formatFraction,
    sumFractions,
    fractionEqualsOne,
    fractionToDecimalString,
    fractionToPercentString,
    reduceFraction,
} from "@hoa-mngr/ui/lib/fraction";

describe("fraction lib", () => {
    it("parses p/q, integers, and terminating decimals", () => {
        expect(parseFraction("3/8")).toEqual({ num: 3, den: 8 });
        expect(parseFraction(" 1/3 ")).toEqual({ num: 1, den: 3 });
        expect(parseFraction("1")).toEqual({ num: 1, den: 1 });
        expect(parseFraction("0.5")).toEqual({ num: 1, den: 2 });
        expect(parseFraction("0.375")).toEqual({ num: 3, den: 8 });
        expect(parseFraction("0,5")).toEqual({ num: 1, den: 2 }); // Czech decimal comma
    });

    it("rejects garbage, zero, negatives, and > 8 decimal places", () => {
        for (const bad of [
            "",
            "abc",
            "0",
            "-1/2",
            "1/0",
            "0.123456789",
            "1/2/3",
        ]) {
            expect(parseFraction(bad)).toBeNull();
        }
    });

    it("sums exactly and detects Σ=1", () => {
        const thirds = [
            { num: 1, den: 3 },
            { num: 1, den: 3 },
            { num: 1, den: 3 },
        ];
        expect(sumFractions(thirds)).toEqual({ num: 1, den: 1 });
        expect(fractionEqualsOne(sumFractions(thirds))).toBe(true);
        expect(
            fractionEqualsOne(
                sumFractions([
                    { num: 1, den: 2 },
                    { num: 1, den: 3 },
                ]),
            ),
        ).toBe(false);
    });

    it("reduces, formats, renders decimals/percents", () => {
        expect(reduceFraction({ num: 50000000, den: 100000000 })).toEqual({
            num: 1,
            den: 2,
        });
        expect(formatFraction({ num: 3, den: 8 })).toBe("3/8");
        expect(fractionToDecimalString({ num: 1, den: 3 }, 4)).toBe("0.3333");
        expect(fractionToPercentString({ num: 1, den: 2 }, 2)).toBe("50.00 %");
    });
});
