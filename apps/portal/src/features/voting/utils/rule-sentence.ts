import type { TFunction } from "i18next";

import type { SetVoteRulesetResponseDto } from "@/api/generated/model";

// Callers must pass a "voting"-namespace-scoped t (e.g. useTranslation("voting").t);
// a default-namespace TFunction won't type-check the "rules.*" keys used below.
export function buildRuleSentence(
    ruleset: SetVoteRulesetResponseDto,
    t: TFunction<"voting">,
): string {
    const majority =
        ruleset.majorityRuleType === "QUALIFIED_MAJORITY"
            ? t("rules.majorityQualified", {
                  threshold: ruleset.majorityThreshold ?? 50,
              })
            : t("rules.majoritySimple");

    const denominator = ruleset.abstainExcludedFromMajorityDenominator
        ? t("rules.ofVotesCastExclAbstain")
        : t("rules.ofVotesCast");

    const weighting =
        ruleset.weightBasis === "ONE_UNIT_ONE_VOTE"
            ? t("rules.onePerUnit")
            : t("rules.weightedByShares");

    return t("rules.sentence", { majority, denominator, weighting });
}
