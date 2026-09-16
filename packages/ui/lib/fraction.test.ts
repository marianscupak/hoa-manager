import { describe, expect, it } from "vitest";

import {
    formatPercent,
    formatPercentValue,
    fractionsEqual,
    parseFraction,
    percentToFractionOver,
} from "./fraction";

describe("formatPercentValue", () => {
    it("trims trailing zeros", () => {
        expect(formatPercentValue(100)).toBe("100");
        expect(formatPercentValue(99.85)).toBe("99.85");
        expect(formatPercentValue(12.5)).toBe("12.5");
    });
    it("respects dp", () => {
        expect(formatPercentValue(0.123456, 4)).toBe("0.1235");
        expect(formatPercentValue(33.3333, 1)).toBe("33.3");
        expect(formatPercentValue(50.4, 0)).toBe("50");
    });
});

describe("formatPercent", () => {
    it("appends the spaced percent sign", () => {
        expect(formatPercent(100)).toBe("100 %");
        expect(formatPercent(50.0, 1)).toBe("50 %");
        expect(formatPercent(99.85)).toBe("99.85 %");
    });
});

describe("parseFraction", () => {
    it("keeps an explicit numerator/denominator exactly as typed", () => {
        // Cadastre shares are conventionally written over the house's common
        // denominator; 3200/10000 must not silently become 8/25.
        expect(parseFraction("3200/10000")).toEqual({ num: 3200, den: 10000 });
        expect(parseFraction("50/100")).toEqual({ num: 50, den: 100 });
    });

    it("parses a percent with or without the spaced sign", () => {
        expect(parseFraction("75 %")).toEqual({ num: 3, den: 4 });
        expect(parseFraction("75%")).toEqual({ num: 3, den: 4 });
        expect(parseFraction("100 %")).toEqual({ num: 1, den: 1 });
        expect(parseFraction("66,67 %")).toEqual({ num: 6667, den: 10000 });
        expect(parseFraction("12.5 %")).toEqual({ num: 1, den: 8 });
    });

    it("rejects an empty or zero percent", () => {
        expect(parseFraction("%")).toBeNull();
        expect(parseFraction("0 %")).toBeNull();
        expect(parseFraction("abc %")).toBeNull();
    });
});

describe("fractionsEqual", () => {
    it("compares by value, not by representation", () => {
        expect(fractionsEqual({ num: 50, den: 100 }, { num: 1, den: 2 })).toBe(
            true,
        );
        expect(fractionsEqual({ num: 2, den: 3 }, { num: 3, den: 4 })).toBe(
            false,
        );
    });
});

describe("percentToFractionOver", () => {
    it("snaps to the nearest share over the house denominator", () => {
        expect(percentToFractionOver("8.56", 1332)).toEqual({
            num: 114,
            den: 1332,
        });
        expect(percentToFractionOver("8.6", 1332)).toEqual({
            num: 115,
            den: 1332,
        });
    });

    it("keeps an exact percent exact, still over that denominator", () => {
        expect(percentToFractionOver("50", 1332)).toEqual({
            num: 666,
            den: 1332,
        });
        expect(percentToFractionOver("25", 10000)).toEqual({
            num: 2500,
            den: 10000,
        });
    });

    it("returns the exact reduced fraction when there is no denominator", () => {
        expect(percentToFractionOver("8.56")).toEqual({ num: 107, den: 1250 });
        expect(percentToFractionOver("50")).toEqual({ num: 1, den: 2 });
    });

    it("accepts a comma as the decimal separator", () => {
        expect(percentToFractionOver("8,56", 1332)).toEqual({
            num: 114,
            den: 1332,
        });
        expect(percentToFractionOver("12,5")).toEqual({ num: 1, den: 8 });
    });

    it("does not drift on a long decimal the way floating point would", () => {
        // 0.07 * 3 / 100 is 0.0021000000000000003 in float; over a large
        // denominator the naive rounding lands a share too low.
        expect(percentToFractionOver("0.07", 300000)).toEqual({
            num: 210,
            den: 300000,
        });
    });

    it("rejects empty, non-numeric, zero and vanishing values", () => {
        expect(percentToFractionOver("", 1332)).toBeNull();
        expect(percentToFractionOver("abc", 1332)).toBeNull();
        expect(percentToFractionOver("0", 1332)).toBeNull();
        // 0.001 % of 100 rounds away to nothing rather than to 0/100.
        expect(percentToFractionOver("0.001", 100)).toBeNull();
    });

    it("ignores a denominator that is not a usable whole number", () => {
        expect(percentToFractionOver("50", 0)).toEqual({ num: 1, den: 2 });
        expect(percentToFractionOver("50", 1332.5)).toEqual({
            num: 1,
            den: 2,
        });
    });
});
