import { describe, expect, it } from "vitest";

import {
    formatPercent,
    formatPercentValue,
    fractionsEqual,
    parseFraction,
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
