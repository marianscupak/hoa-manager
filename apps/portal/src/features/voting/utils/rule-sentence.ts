import type { TFunction } from "i18next";

import type { SetVoteRulesetResponseDto } from "@/api/generated/model";

// Callers must pass a "voting"-namespace-scoped t (e.g. useTranslation("voting").t);
// a default-namespace TFunction won't type-check the "rules.*" keys used below.
// This contract applies to both buildRuleSentence and buildMajorityFragment.

// The simple-vs-qualified majority phrase, shared by buildRuleSentence (the
// full per-question rule sentence) and any caller that only needs the
// majority fragment on its own (e.g. results verdict-card.tsx's one-line
// reason sentences). Accepts a nullable ruleset so callers can pass
// `question.effectiveRuleset ?? voteRuleset` directly without a null check;
// a missing ruleset falls back to the simple-majority phrasing.
export function buildMajorityFragment(
    ruleset: SetVoteRulesetResponseDto | null | undefined,
    t: TFunction<"voting">,
): string {
    return ruleset?.majorityRuleType === "QUALIFIED_MAJORITY"
        ? t("rules.majorityQualified", {
              threshold: ruleset.majorityThreshold ?? 50,
          })
        : t("rules.majoritySimple");
}

export function buildRuleSentence(
    ruleset: SetVoteRulesetResponseDto,
    t: TFunction<"voting">,
): string {
    const majority = buildMajorityFragment(ruleset, t);

    const denominator = ruleset.abstainExcludedFromMajorityDenominator
        ? t("rules.ofVotesCastExclAbstain")
        : t("rules.ofVotesCast");

    const weighting =
        ruleset.weightBasis === "ONE_UNIT_ONE_VOTE"
            ? t("rules.onePerUnit")
            : t("rules.weightedByShares");

    return t("rules.sentence", { majority, denominator, weighting });
}
