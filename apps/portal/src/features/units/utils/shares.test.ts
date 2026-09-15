import { describe, expect, it } from "vitest";

import { isCoOwnedShare, shareCellValues, sharePercent } from "./shares";

describe("sharePercent", () => {
    it("converts a stored fraction to a percentage", () => {
        expect(sharePercent(1650, 10000)).toBe(16.5);
        expect(sharePercent(1, 1)).toBe(100);
    });

    it("keeps full precision so the caller decides the rounding", () => {
        // The API rounds its own percentage to two decimals; the pages
        // compute from the fraction instead and round at render time.
        expect(sharePercent(1, 3)).toBeCloseTo(33.3333, 4);
    });

    it("returns zero for a zero denominator instead of Infinity or NaN", () => {
        expect(sharePercent(1, 0)).toBe(0);
        expect(sharePercent(0, 0)).toBe(0);
    });
});

describe("isCoOwnedShare", () => {
    it("is false when the party holds the whole unit", () => {
        expect(isCoOwnedShare(1, 1)).toBe(false);
        expect(isCoOwnedShare(10000, 10000)).toBe(false);
    });

    it("is true for any share smaller than the whole", () => {
        expect(isCoOwnedShare(1, 2)).toBe(true);
        expect(isCoOwnedShare(3200, 10000)).toBe(true);
    });

    it("is false for spouses holding the whole unit jointly", () => {
        // The API reports a jointly held party's share undivided — 1/1
        // for the two of them together, not 1/2 each — so the fraction
        // alone answers the question this helper is asked: does anybody
        // outside the party hold part of the unit? Here nobody does.
        // The joint holding itself is shown next to the two names on
        // the ownership table, which is the only place it means
        // something.
        expect(isCoOwnedShare(1, 1)).toBe(false);
    });

    it("compares the fraction, not a rounded percentage", () => {
        // A third of a unit is 33.33 % after rounding, two thirds
        // 66.67 %. Neither is 100, and the point of comparing the
        // fraction is that no rounding step can ever make a partial
        // share look whole, or a whole share look partial.
        expect(isCoOwnedShare(1, 3)).toBe(true);
        expect(isCoOwnedShare(3, 3)).toBe(false);
    });

    it("treats a nonsensical over-whole share as not co-owned", () => {
        // The API validates that a unit's parties sum to exactly 1/1, so
        // this cannot arrive from a healthy backend. Showing no chip is
        // the quiet failure mode; a "co-owned" chip would be a lie.
        expect(isCoOwnedShare(2, 1)).toBe(false);
    });

    it("is false when the denominator is missing", () => {
        expect(isCoOwnedShare(1, 0)).toBe(false);
    });
});

describe("shareCellValues", () => {
    it("leads with the fraction and carries the percentage underneath", () => {
        expect(shareCellValues(6342, 206422)).toEqual({
            value: "6342/206422",
            secondary: "3.07 %",
        });
    });

    it("renders a whole share without trailing zeros", () => {
        expect(shareCellValues(1, 1)).toEqual({
            value: "1/1",
            secondary: "100 %",
        });
    });

    it("survives a missing denominator rather than printing NaN", () => {
        expect(shareCellValues(1, 0)).toEqual({
            value: "1/0",
            secondary: "0 %",
        });
    });
});
