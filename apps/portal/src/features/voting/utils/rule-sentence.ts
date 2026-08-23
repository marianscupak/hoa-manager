import type { TFunction } from "i18next";

import { fractionToTrimmedPercentString } from "@hoa-mngr/ui";

// Callers must pass a "voting"-namespace-scoped t (e.g. useTranslation("voting").t);
// a default-namespace TFunction won't type-check the "rules.*" keys used below.
// This contract applies to both buildRuleSentence and buildMajorityFragment.

/**
 * The minimal ruleset shape both call sites can supply: the vote-level
 * wizard's live (pre-submit) form values (CreateVoteRulesetValues, where
 * majorityThreshold/majorityComparator are only set for QUALIFIED_MAJORITY)
 * and the server's materialized SetVoteRulesetResponseDto (where they're
 * always present) both satisfy this structurally.
 */
export interface RuleSentenceRuleset {
    weightBasis: string;
    majorityRuleType: string;
    majorityDenominatorBasis: string;
    majorityThreshold?: { num: number; den: number } | null;
}

// The majority phrase, shared by buildRuleSentence (the full per-question
// rule sentence) and any caller that only needs the majority fragment on
// its own (e.g. results verdict-card.tsx's one-line reason sentences).
// Accepts a nullable ruleset so callers can pass
// `question.effectiveRuleset ?? voteRuleset` directly without a null check;
// a missing ruleset falls back to the simple-majority phrasing.
export function buildMajorityFragment(
    ruleset: RuleSentenceRuleset | null | undefined,
    t: TFunction<"voting">,
): string {
    if (!ruleset) return t("rules.majoritySimple");

    if (ruleset.majorityRuleType === "UNANIMITY") {
        return t("rules.majorityUnanimity");
    }

    if (ruleset.majorityRuleType === "QUALIFIED_MAJORITY") {
        const threshold = ruleset.majorityThreshold;
        // BigInt-exact rounding, trimmed (matches the locale string's own
        // trailing " %") — raw float division here previously rendered
        // e.g. "66.66666666666666" for a 2/3 threshold.
        const percent = threshold
            ? fractionToTrimmedPercentString(threshold)
            : "50";
        return t("rules.majorityQualified", { threshold: percent });
    }

    return t("rules.majoritySimple");
}

export function buildRuleSentence(
    ruleset: RuleSentenceRuleset,
    t: TFunction<"voting">,
): string {
    const majority = buildMajorityFragment(ruleset, t);

    const denominator =
        ruleset.majorityDenominatorBasis === "ALL_VOTES"
            ? t("rules.ofAllVotes")
            : t("rules.ofVotesCast");

    const weighting =
        ruleset.weightBasis === "ONE_UNIT_ONE_VOTE"
            ? t("rules.onePerUnit")
            : t("rules.weightedByShares");

    return t("rules.sentence", { majority, denominator, weighting });
}
