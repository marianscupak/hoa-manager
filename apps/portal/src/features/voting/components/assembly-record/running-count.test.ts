import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import { runningCountFigure } from "./running-count";

// Only the unit-count line is translated; the identity function is enough to
// show which key was asked for.
const t = ((key: string, opts?: { count?: number }) =>
    `${opts?.count ?? ""}|${key}`) as unknown as TFunction<"voting">;

const ALL = { num: "1", den: "1" };

describe("runningCountFigure", () => {
    it("leads with the share when shares decide the vote", () => {
        // The handoff led with unit counts. Under the statutory ruleset that is
        // misleading: nine small units voting yes can still be a minority.
        const figure = runningCountFigure(
            { weight: { num: "1", den: "4" }, unitCount: 9 },
            ALL,
            "UNIT_SHARE",
            t,
        );

        expect(figure.primary).toBe("25 %");
        expect(figure.secondary).toContain("9|");
    });

    it("leads with the unit count when units decide the vote", () => {
        const figure = runningCountFigure(
            { weight: { num: "1", den: "4" }, unitCount: 9 },
            ALL,
            "ONE_UNIT_ONE_VOTE",
            t,
        );

        expect(figure.primary).toBe("9|assemblyRecord.tally.units");
        expect(figure.secondary).toBeNull();
    });

    it("computes the share against all votes, not the ballots entered", () => {
        // A denominator that grows while the board types would make the number
        // move both ways; a fixed one only ever rises.
        const figure = runningCountFigure(
            { weight: { num: "1", den: "8" }, unitCount: 2 },
            { num: "1", den: "2" },
            "UNIT_SHARE",
            t,
        );

        expect(figure.primary).toBe("25 %");
    });

    it("reads zero as zero rather than NaN", () => {
        const figure = runningCountFigure(
            { weight: { num: "0", den: "1" }, unitCount: 0 },
            { num: "0", den: "1" },
            "UNIT_SHARE",
            t,
        );

        expect(figure.primary).toBe("0 %");
    });

    it("trims a trailing zero the way every other percentage here does", () => {
        const figure = runningCountFigure(
            { weight: { num: "1", den: "2" }, unitCount: 1 },
            ALL,
            "UNIT_SHARE",
            t,
        );

        expect(figure.primary).toBe("50 %");
    });
});
