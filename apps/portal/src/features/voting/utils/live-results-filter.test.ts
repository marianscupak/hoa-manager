import { describe, expect, it } from "vitest";

import { filterUnits, type LiveResultsRow } from "./live-results-filter";

const row = (over: Partial<LiveResultsRow>): LiveResultsRow =>
    ({
        id: "u1",
        unitId: "u1",
        unitNo: "A1",
        share: "5/100",
        status: "NOT_VOTED",
        ownsUnit: false,
        isProxy: false,
        ...over,
    }) as LiveResultsRow;

const UNITS = [
    row({
        id: "1",
        unitNo: "101",
        status: "VOTED",
        ownerNames: ["Jana Nováková"],
    }),
    row({ id: "2", unitNo: "102", status: "NOT_VOTED" }),
    row({ id: "3", unitNo: "103", status: "INELIGIBLE" }),
];

describe("filterUnits", () => {
    it("returns everything for the all filter and an empty search", () => {
        expect(filterUnits(UNITS, { search: "", filter: "all" })).toHaveLength(
            3,
        );
    });

    it("keeps only units that have voted", () => {
        const result = filterUnits(UNITS, { search: "", filter: "voted" });
        expect(result.map((u) => u.unitNo)).toEqual(["101"]);
    });

    it("treats ineligible units as not voted", () => {
        const result = filterUnits(UNITS, { search: "", filter: "notVoted" });
        expect(result.map((u) => u.unitNo)).toEqual(["102", "103"]);
    });

    it("matches the unit number", () => {
        const result = filterUnits(UNITS, { search: "10", filter: "all" });
        expect(result).toHaveLength(3);
    });

    it("matches owner names when they are present", () => {
        const result = filterUnits(UNITS, {
            search: "nováková",
            filter: "all",
        });
        expect(result.map((u) => u.unitNo)).toEqual(["101"]);
    });

    it("ignores diacritics in the search", () => {
        const result = filterUnits(UNITS, {
            search: "novakova",
            filter: "all",
        });
        expect(result.map((u) => u.unitNo)).toEqual(["101"]);
    });

    it("never matches on names an owner cannot see", () => {
        // The owner payload carries no ownerNames at all, so a name search
        // must simply find nothing rather than fall back to some other field.
        const ownerUnits = [row({ id: "1", unitNo: "101", status: "VOTED" })];
        expect(
            filterUnits(ownerUnits, { search: "nováková", filter: "all" }),
        ).toEqual([]);
    });

    it("combines search and filter with AND", () => {
        const result = filterUnits(UNITS, { search: "102", filter: "voted" });
        expect(result).toEqual([]);
    });
});
