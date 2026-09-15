import { describe, expect, it } from "vitest";

import { formatTallyOption } from "./tally-display";

const option = {
    optionId: "opt-yes",
    voteUnitCount: 11,
    voteWeight: { num: "11", den: "24", decimal: "0.4583" },
};

const denominator = { num: "1", den: "1", decimal: "1.0000" };
const zeroDenominator = { num: "0", den: "1", decimal: "0.0000" };

describe("formatTallyOption", () => {
    it("leads with the unit count for one-unit-one-vote", () => {
        const result = formatTallyOption(
            option,
            denominator,
            "ONE_UNIT_ONE_VOTE",
        );
        expect(result.primary).toBe("11");
        expect(result.secondary).toBeNull();
    });

    it("leads with the share for share-weighted votes", () => {
        const result = formatTallyOption(option, denominator, "UNIT_SHARE");
        expect(result.primary).toBe("45.83 %");
        expect(result.secondary).toBe(11);
    });

    it("suppresses the percentage when nothing countable has been cast", () => {
        const result = formatTallyOption(
            { ...option, voteUnitCount: 0, voteWeight: zeroDenominator },
            zeroDenominator,
            "UNIT_SHARE",
        );
        // Not "0 %": no ballots is a different state from a real zero share,
        // and a guarded division would render them identically.
        expect(result.primary).toBeNull();
        expect(result.secondary).toBe(0);
    });

    it("still renders a real zero share against a non-zero denominator", () => {
        // The case above moves three things at once, so on its own it would
        // also pass an implementation that bailed out on voteUnitCount === 0.
        // Only the denominator may suppress the figure.
        const result = formatTallyOption(
            { ...option, voteUnitCount: 0, voteWeight: zeroDenominator },
            denominator,
            "UNIT_SHARE",
        );
        expect(result.primary).toBe("0 %");
    });

    it("renders an exact 50 % rather than 50.06 % from rounded decimals", () => {
        // 1/24 over 1/12 is exactly 50 %. Each side's `.decimal` is already
        // rounded to 4 places (0.0417 / 0.0833), so dividing those strings as
        // floats gives 50.06 % — landing right on the most common majority
        // threshold. Only the exact num/den strings, cross-multiplied, avoid
        // this — this is the bug fix 3 exists to close.
        const result = formatTallyOption(
            {
                optionId: "opt-yes",
                voteUnitCount: 1,
                voteWeight: { num: "1", den: "24", decimal: "0.0417" },
            },
            { num: "1", den: "12", decimal: "0.0833" },
            "UNIT_SHARE",
        );
        expect(result.primary).toBe("50 %");
    });
});
