import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import {
    buildMajorityFragment,
    buildRuleSentence,
    type RuleSentenceRuleset,
} from "./rule-sentence";

const fakeT = ((key: string, params?: Record<string, unknown>) =>
    `${key}${params ? ":" + JSON.stringify(params) : ""}`) as unknown as TFunction<"voting">;

const baseRuleset: RuleSentenceRuleset = {
    weightBasis: "UNIT_SHARE",
    majorityRuleType: "SIMPLE_MAJORITY",
    majorityDenominatorBasis: "ALL_VOTES",
};

describe("buildRuleSentence", () => {
    it("includes the qualified-majority phrase with the threshold percent for a QUALIFIED_MAJORITY ruleset", () => {
        const sentence = buildRuleSentence(
            {
                ...baseRuleset,
                majorityRuleType: "QUALIFIED_MAJORITY",
                majorityThreshold: { num: 3, den: 4 },
            },
            fakeT,
        );

        // The inner t() result (containing its own {"threshold":"75"} JSON)
        // is re-embedded as a param of the outer t("rules.sentence", ...)
        // call, so the fake t's JSON.stringify escapes those inner quotes.
        // threshold is a formatted string (not a number) so the locale's
        // "{{threshold}} %" interpolation never renders raw float noise.
        expect(sentence).toContain(
            'rules.majorityQualified:{\\"threshold\\":\\"75\\"}',
        );
        expect(sentence).not.toContain("rules.majoritySimple");
    });

    it("includes the unanimity phrase for a UNANIMITY ruleset", () => {
        const sentence = buildRuleSentence(
            { ...baseRuleset, majorityRuleType: "UNANIMITY" },
            fakeT,
        );

        expect(sentence).toContain("rules.majorityUnanimity");
    });

    it("includes the all-votes denominator phrase when majorityDenominatorBasis is ALL_VOTES", () => {
        const sentence = buildRuleSentence(
            { ...baseRuleset, majorityDenominatorBasis: "ALL_VOTES" },
            fakeT,
        );

        expect(sentence).toContain("rules.ofAllVotes");
    });

    it("includes the votes-cast denominator phrase when majorityDenominatorBasis is VOTES_CAST", () => {
        const sentence = buildRuleSentence(
            { ...baseRuleset, majorityDenominatorBasis: "VOTES_CAST" },
            fakeT,
        );

        expect(sentence).toContain("rules.ofVotesCast");
        expect(sentence).not.toContain("rules.ofAllVotes");
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

    it("returns the qualified-majority fragment with the threshold percent for a QUALIFIED_MAJORITY ruleset", () => {
        const fragment = buildMajorityFragment(
            {
                ...baseRuleset,
                majorityRuleType: "QUALIFIED_MAJORITY",
                majorityThreshold: { num: 3, den: 4 },
            },
            fakeT,
        );

        expect(fragment).toBe('rules.majorityQualified:{"threshold":"75"}');
    });

    it("renders a non-terminating threshold rounded and trimmed to 2 places", () => {
        // Regression case: selecting the 2/3 preset previously rendered the
        // raw float "66.66666666666666" instead of a rounded percent.
        const fragment = buildMajorityFragment(
            {
                ...baseRuleset,
                majorityRuleType: "QUALIFIED_MAJORITY",
                majorityThreshold: { num: 2, den: 3 },
            },
            fakeT,
        );

        expect(fragment).toBe('rules.majorityQualified:{"threshold":"66.67"}');
    });

    it("defaults the qualified threshold to 50 when majorityThreshold is unset", () => {
        const fragment = buildMajorityFragment(
            { ...baseRuleset, majorityRuleType: "QUALIFIED_MAJORITY" },
            fakeT,
        );

        expect(fragment).toBe('rules.majorityQualified:{"threshold":"50"}');
    });

    it("returns the unanimity fragment for a UNANIMITY ruleset", () => {
        const fragment = buildMajorityFragment(
            { ...baseRuleset, majorityRuleType: "UNANIMITY" },
            fakeT,
        );

        expect(fragment).toBe("rules.majorityUnanimity");
    });

    it("falls back to the simple-majority fragment when the ruleset is null or undefined", () => {
        expect(buildMajorityFragment(null, fakeT)).toBe("rules.majoritySimple");
        expect(buildMajorityFragment(undefined, fakeT)).toBe(
            "rules.majoritySimple",
        );
    });
});
