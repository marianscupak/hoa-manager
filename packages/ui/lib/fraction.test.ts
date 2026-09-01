import { describe, expect, it } from "vitest";

import { formatPercent, formatPercentValue } from "./fraction";

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
