import { describe, expect, it } from "vitest";

import {
    computeParticipationStats,
    deriveQuorumThresholdPercent,
    deriveQuorumThresholdPercentLabel,
} from "./participation-stats";

const turnout = {
    participationUnitCount: 14,
    totalVotesUnitCount: 24,
    participationPercent: "50.50",
};

const shareQuorum = {
    quorum: { measure: "UNIT_SHARE", threshold: { num: 1, den: 2 } },
} as never;

const unitQuorum = {
    quorum: { measure: "UNIT_COUNT", threshold: { num: 3, den: 5 } },
} as never;

describe("computeParticipationStats", () => {
    it("uses the server percent on the share axis", () => {
        const stats = computeParticipationStats(turnout, shareQuorum);
        expect(stats.pct).toBeCloseTo(50.5);
        expect(stats.isUnitCount).toBe(false);
    });

    it("divides unit counts on the unit-count axis", () => {
        const stats = computeParticipationStats(turnout, unitQuorum);
        expect(stats.pct).toBeCloseTo((14 / 24) * 100);
        expect(stats.isUnitCount).toBe(true);
    });

    it("falls back to the weight axis when the vote has no quorum", () => {
        const stats = computeParticipationStats(turnout, {
            quorum: null,
        } as never);
        expect(stats.isUnitCount).toBe(false);
        expect(stats.pct).toBeCloseTo(50.5);
    });

    it("reports zero rather than dividing by zero", () => {
        const stats = computeParticipationStats(
            { ...turnout, totalVotesUnitCount: 0 },
            unitQuorum,
        );
        expect(stats.pct).toBe(0);
    });
});

describe("quorum threshold helpers", () => {
    it("reads the threshold off the ruleset", () => {
        expect(deriveQuorumThresholdPercent(unitQuorum)).toBeCloseTo(60);
        expect(deriveQuorumThresholdPercentLabel(unitQuorum)).toBe("60");
    });

    it("defaults to 50 when the vote has no quorum", () => {
        expect(deriveQuorumThresholdPercent(null)).toBe(50);
        expect(deriveQuorumThresholdPercentLabel(null)).toBe("50");
    });
});
