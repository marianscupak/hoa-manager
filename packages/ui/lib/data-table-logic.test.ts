import { describe, expect, it } from "vitest";

import {
    getFooterInfo,
    localeNumericCompare,
    matchesSearch,
    normalizeForSearch,
} from "./data-table-logic";

describe("normalizeForSearch", () => {
    it("strips diacritics and lowercases", () => {
        expect(normalizeForSearch("Nováková")).toBe("novakova");
        expect(normalizeForSearch("  Dvořák ")).toBe("dvorak");
    });
});

describe("matchesSearch", () => {
    it("matches diacritic-insensitively in both directions", () => {
        expect(matchesSearch("Nováková", "novakova")).toBe(true);
        expect(matchesSearch("Novakova", "nováková")).toBe(true);
        expect(matchesSearch("Nováková", "dvorak")).toBe(false);
    });

    it("treats null/undefined as no match", () => {
        expect(matchesSearch(null, "x")).toBe(false);
        expect(matchesSearch(undefined, "x")).toBe(false);
    });

    it("stringifies non-string values", () => {
        expect(matchesSearch(225, "22")).toBe(true);
    });
});

describe("localeNumericCompare", () => {
    it("sorts unit numbers numerically", () => {
        expect(localeNumericCompare("2", "10")).toBeLessThan(0);
        expect(localeNumericCompare("A-10", "A-2")).toBeGreaterThan(0);
        expect(localeNumericCompare("A-2", "A-2")).toBe(0);
    });
});

describe("getFooterInfo", () => {
    it("reports an unpaginated small table", () => {
        expect(getFooterInfo(0, 10, 3)).toEqual({
            from: 1,
            to: 3,
            total: 3,
            paginated: false,
        });
    });

    it("reports the first page of a paginated table", () => {
        expect(getFooterInfo(0, 10, 24)).toEqual({
            from: 1,
            to: 10,
            total: 24,
            paginated: true,
        });
    });

    it("clamps the last page range to the total", () => {
        expect(getFooterInfo(2, 10, 24)).toEqual({
            from: 21,
            to: 24,
            total: 24,
            paginated: true,
        });
    });

    it("handles an empty table", () => {
        expect(getFooterInfo(0, 10, 0)).toEqual({
            from: 0,
            to: 0,
            total: 0,
            paginated: false,
        });
    });
});
