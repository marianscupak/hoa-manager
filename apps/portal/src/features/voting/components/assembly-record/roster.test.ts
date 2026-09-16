import { describe, expect, it } from "vitest";

import type { AssemblyUnit } from "./roster";
import { filterRoster, rosterState } from "./roster";

function unit(overrides: Partial<AssemblyUnit> = {}): AssemblyUnit {
    return {
        unitId: "u1",
        unitNo: "A-101",
        owners: [{ ownerId: "o1", displayName: "Jana Nováková" }],
        share: { num: "1", den: "4", decimal: "0.2500" },
        eligibility: "ELIGIBLE",
        ineligibleReason: null,
        attendance: null,
        voterOwnerId: null,
        voterNote: null,
        answers: [],
        ...overrides,
    } as AssemblyUnit;
}

const answers = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
        questionId: `q${i + 1}`,
        optionId: `o${i + 1}`,
    }));

describe("rosterState", () => {
    it("is complete when a present unit has answered every question", () => {
        expect(
            rosterState(unit({ attendance: "PRESENT", answers: answers(2) }), 2),
        ).toBe("complete");
    });

    it("is toEnter when a present unit has answered only some", () => {
        // This is the state the publish gate blocks on, so the roster has to
        // separate it from "absent" and from "not looked at yet".
        expect(
            rosterState(unit({ attendance: "PRESENT", answers: answers(1) }), 2),
        ).toBe("toEnter");
    });

    it("is toEnter when a present unit has answered none", () => {
        expect(rosterState(unit({ attendance: "PRESENT" }), 2)).toBe("toEnter");
    });

    it("is absent when the board marked it absent", () => {
        expect(rosterState(unit({ attendance: "ABSENT" }), 2)).toBe("absent");
    });

    it("is unset when the board has not reached the unit", () => {
        expect(rosterState(unit({ attendance: null }), 2)).toBe("unset");
    });

    it("is ineligible regardless of attendance", () => {
        expect(
            rosterState(
                unit({ eligibility: "INELIGIBLE", attendance: null }),
                2,
            ),
        ).toBe("ineligible");
    });

    it("treats a vote with no questions as complete once a unit is present", () => {
        // Guards against `0 < 0` reading as incomplete and stranding the board.
        expect(rosterState(unit({ attendance: "PRESENT" }), 0)).toBe("complete");
    });
});

describe("filterRoster", () => {
    const rows = [
        unit({
            unitId: "a",
            unitNo: "A-101",
            owners: [{ ownerId: "o1", displayName: "Jana Nováková" }],
            attendance: "PRESENT",
        }),
        unit({
            unitId: "b",
            unitNo: "A-102",
            owners: [{ ownerId: "o2", displayName: "Petr Novák" }],
            attendance: "ABSENT",
        }),
        unit({
            unitId: "c",
            unitNo: "B-201",
            owners: [{ ownerId: "o3", displayName: "Eva Dvořáková" }],
            attendance: null,
        }),
    ];

    it("matches the search against the unit number", () => {
        expect(filterRoster(rows, 2, "all", "B-2").map((u) => u.unitId)).toEqual(
            ["c"],
        );
    });

    it("matches the search against an owner name, ignoring case", () => {
        expect(
            filterRoster(rows, 2, "all", "nováková").map((u) => u.unitId),
        ).toEqual(["a"]);
    });

    it("combines search and filter with AND", () => {
        expect(
            filterRoster(rows, 2, "todo", "A-1").map((u) => u.unitId),
        ).toEqual(["a"]);
    });

    it("treats a unit nobody has reached as neither present nor absent", () => {
        expect(filterRoster(rows, 2, "present", "").map((u) => u.unitId)).toEqual(
            ["a"],
        );
        expect(filterRoster(rows, 2, "absent", "").map((u) => u.unitId)).toEqual(
            ["b"],
        );
    });

    it("returns everything for the all filter and an empty search", () => {
        expect(filterRoster(rows, 2, "all", "")).toHaveLength(3);
    });

    it("ignores surrounding whitespace in the search", () => {
        expect(
            filterRoster(rows, 2, "all", "  petr  ").map((u) => u.unitId),
        ).toEqual(["b"]);
    });
});
