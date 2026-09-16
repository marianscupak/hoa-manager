import { describe, expect, it } from "vitest";

import { mostCommonDenominator } from "./building-denominator";

const units = (...dens: number[]) =>
    dens.map((buildingShareDenominator) => ({ buildingShareDenominator }));

describe("mostCommonDenominator", () => {
    it("picks the denominator the house already agrees on", () => {
        expect(mostCommonDenominator(units(1332, 1332, 1332))).toBe(1332);
    });

    it("tolerates the odd unit entered over a different base", () => {
        expect(mostCommonDenominator(units(1332, 1332, 1332, 10000))).toBe(
            1332,
        );
    });

    it("breaks a tie towards the larger denominator", () => {
        expect(mostCommonDenominator(units(1332, 10000))).toBe(10000);
        expect(mostCommonDenominator(units(10000, 1332))).toBe(10000);
    });

    it("suggests nothing when there are no units yet", () => {
        expect(mostCommonDenominator([])).toBeUndefined();
    });

    it("ignores denominators that could not be written over", () => {
        expect(mostCommonDenominator(units(0, -5, 1332))).toBe(1332);
        expect(mostCommonDenominator(units(0, -5))).toBeUndefined();
    });
});
