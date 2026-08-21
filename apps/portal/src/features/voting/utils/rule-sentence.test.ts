import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import type { SetVoteRulesetResponseDto } from "@/api/generated/model";

import { buildMajorityFragment, buildRuleSentence } from "./rule-sentence";

const fakeT = ((key: string, params?: Record<string, unknown>) =>
    `${key}${params ? ":" + JSON.stringify(params) : ""}`) as unknown as TFunction<"voting">;

const baseRuleset: SetVoteRulesetResponseDto = {
    weightBasis: "UNIT_SHARE",
    quorumMeasure: "UNIT_SHARE",
    quorumElectorateBasis: "ALL_UNITS",
    quorumThreshold: 50,
    majorityRuleType: "SIMPLE_MAJORITY",
    allowAbstain: true,
    abstainExcludedFromMajorityDenominator: false,
    allowCoOwnerIndividualVote: false,
};

describe("buildRuleSentence", () => {
    it("includes the qualified-majority phrase with the threshold for a QUALIFIED_MAJORITY ruleset", () => {
        const sentence = buildRuleSentence(
            {
                ...baseRuleset,
                majorityRuleType: "QUALIFIED_MAJORITY",
                majorityThreshold: 75,
            },
            fakeT,
        );

        // The inner t() result (containing its own {"threshold":75} JSON) is
        // re-embedded as a param of the outer t("rules.sentence", ...) call,
        // so the fake t's JSON.stringify escapes those inner quotes.
        expect(sentence).toContain(
            'rules.majorityQualified:{\\"threshold\\":75}',
        );
        expect(sentence).not.toContain("rules.majoritySimple");
    });

    it("includes the excl-abstain denominator phrase when abstains are excluded from the majority denominator", () => {
        const sentence = buildRuleSentence(
            { ...baseRuleset, abstainExcludedFromMajorityDenominator: true },
            fakeT,
        );

        expect(sentence).toContain("rules.ofVotesCastExclAbstain");
    });

    it("includes the one-vote-per-unit weighting phrase for ONE_UNIT_ONE_VOTE weighting", () => {
        const sentence = buildRuleSentence(
            { ...baseRuleset, weightBasis: "ONE_UNIT_ONE_VOTE" },
            fakeT,
        );

        expect(sentence).toContain("rules.onePerUnit");
    });
});

describe("buildMajorityFragment", () => {
    it("returns the simple-majority fragment for a SIMPLE_MAJORITY ruleset", () => {
        const fragment = buildMajorityFragment(baseRuleset, fakeT);

        expect(fragment).toBe("rules.majoritySimple");
    });

    it("returns the qualified-majority fragment with the threshold for a QUALIFIED_MAJORITY ruleset", () => {
        const fragment = buildMajorityFragment(
            {
                ...baseRuleset,
                majorityRuleType: "QUALIFIED_MAJORITY",
                majorityThreshold: 75,
            },
            fakeT,
        );

        expect(fragment).toBe('rules.majorityQualified:{"threshold":75}');
    });

    it("defaults the qualified threshold to 50 when majorityThreshold is unset", () => {
        const fragment = buildMajorityFragment(
            { ...baseRuleset, majorityRuleType: "QUALIFIED_MAJORITY" },
            fakeT,
        );

        expect(fragment).toBe('rules.majorityQualified:{"threshold":50}');
    });

    it("falls back to the simple-majority fragment when the ruleset is null or undefined", () => {
        expect(buildMajorityFragment(null, fakeT)).toBe("rules.majoritySimple");
        expect(buildMajorityFragment(undefined, fakeT)).toBe(
            "rules.majoritySimple",
        );
    });
});
