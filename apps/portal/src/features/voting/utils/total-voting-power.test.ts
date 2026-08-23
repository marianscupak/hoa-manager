import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import { formatTotalVotingPower } from "./total-voting-power";

const fakeT = ((key: string, params?: Record<string, unknown>) =>
    `${key}${params ? ":" + JSON.stringify(params) : ""}`) as unknown as TFunction<"voting">;

describe("formatTotalVotingPower", () => {
    it("renders a trimmed percent for a UNIT_SHARE ruleset", () => {
        expect(
            formatTotalVotingPower(
                { value: "0.6667", maximum: "1.0000" },
                "UNIT_SHARE",
                fakeT,
            ),
        ).toBe("66.67 %");
    });

    it("trims a whole-number percent instead of padding it", () => {
        expect(
            formatTotalVotingPower(
                { value: "0.5000", maximum: "1.0000" },
                "UNIT_SHARE",
                fakeT,
            ),
        ).toBe("50 %");
    });

    it("renders 0 % rather than dividing by zero when the tenant has no shares on record", () => {
        expect(
            formatTotalVotingPower(
                { value: "0.0000", maximum: "0.0000" },
                "UNIT_SHARE",
                fakeT,
            ),
        ).toBe("0 %");
    });

    it("renders a vote count, never a percent, for a single ready unit under ONE_UNIT_ONE_VOTE", () => {
        // Regression case: value === maximum === "1.0000" whenever the
        // building's shares happen to sum to 1/1 (required to open a vote
        // at all), so a magnitude check alone can't distinguish this from
        // a UNIT_SHARE member who owns the entire building — only
        // weightBasis can.
        const result = formatTotalVotingPower(
            { value: "1.0000", maximum: "1.0000" },
            "ONE_UNIT_ONE_VOTE",
            fakeT,
        );

        expect(result).not.toBe("100 %");
        expect(result).toBe(
            'detail.statusSidebar.totalPowerVotes:{"count":1}',
        );
    });

    it("renders a vote count for multiple ready units under ONE_UNIT_ONE_VOTE", () => {
        const result = formatTotalVotingPower(
            { value: "3.0000", maximum: "1.0000" },
            "ONE_UNIT_ONE_VOTE",
            fakeT,
        );

        expect(result).not.toContain("%");
        expect(result).toBe(
            'detail.statusSidebar.totalPowerVotes:{"count":3}',
        );
    });

    it("renders the UNIT_SHARE percent when there is no ruleset yet (e.g. a DRAFT vote)", () => {
        // Not a guess: the API's getWeightBasis defaults to UNIT_SHARE when
        // no vote-level ruleset row exists yet, so `value` was computed
        // server-side with that same basis whenever weightBasis is
        // undefined here — the percent is verified-correct, not a fallback
        // of last resort.
        expect(
            formatTotalVotingPower(
                { value: "0.5000", maximum: "1.0000" },
                undefined,
                fakeT,
            ),
        ).toBe("50 %");
    });
});
