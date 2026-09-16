import { describe, expect, it } from "vitest";
import {
    ASSEMBLY_PRESET,
    PER_ROLLAM_PRESET,
    tierIssues,
} from "./ruleset-legal";

describe("ruleset-legal", () => {
    it("both presets are clean for their mode", () => {
        expect(tierIssues("PER_ROLLAM", PER_ROLLAM_PRESET)).toEqual({
            tier1: [],
            tier3: [],
        });
        expect(tierIssues("ASSEMBLY_RECORD", ASSEMBLY_PRESET)).toEqual({
            tier1: [],
            tier3: [],
        });
    });
    it("flags a lowered assembly quorum", () => {
        const bad = {
            ...ASSEMBLY_PRESET,
            quorum: {
                ...ASSEMBLY_PRESET.quorum!,
                threshold: { num: 3, den: 10 },
            },
        };
        expect(tierIssues("ASSEMBLY_RECORD", bad).tier1[0].code).toBe(
            "ASSEMBLY_QUORUM_BELOW_FLOOR",
        );
    });
    it("accepts a majority of all votes for an assembly", () => {
        // The law makes a majority of those present the default but lets the
        // bylaws require a higher number, and all votes over the same
        // threshold is strictly harder to reach. `tierIssues` already allowed
        // it; only the form locked the field.
        const { tier1 } = tierIssues("ASSEMBLY_RECORD", {
            ...ASSEMBLY_PRESET,
            majorityDenominatorBasis: "ALL_VOTES",
        });

        expect(tier1).toEqual([]);
    });
    it("still rejects votes cast for per rollam", () => {
        const { tier1 } = tierIssues("PER_ROLLAM", {
            ...PER_ROLLAM_PRESET,
            majorityDenominatorBasis: "VOTES_CAST",
        });

        expect(tier1).toContainEqual({
            code: "PER_ROLLAM_BASIS_NOT_ALL_VOTES",
        });
    });
    it("flags one-unit-one-vote as tier 3", () => {
        expect(
            tierIssues("PER_ROLLAM", {
                ...PER_ROLLAM_PRESET,
                weightBasis: "ONE_UNIT_ONE_VOTE",
            }).tier3,
        ).toEqual(["ONE_UNIT_ONE_VOTE"]);
    });
});
