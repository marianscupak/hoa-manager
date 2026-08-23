import {
    CreateVoteQuestionDtoType,
    SetVoteRulesetResponseDto,
    UpdateVoteQuestionDto,
    VoteQuestionResponseDto,
} from "@/api/generated/model";

import type { CreateVoteRulesetValues } from "./ruleset-schema";

/**
 * Shared utility to build the UpdateVoteQuestionDto from form values or existing question data.
 * Ensures consistent handling of the ruleset override.
 */
export function mapQuestionToUpdateDto(params: {
    title: string;
    type: CreateVoteQuestionDtoType;
    description?: string;
    sortOrder: number;
    useCustomRuleset?: boolean;
    /**
     * The vote's base ruleset. A question override may only tighten the
     * majority rule (majorityRuleType / majorityDenominatorBasis /
     * threshold / comparator) — the server's validateQuestionOverride
     * requires weightBasis, quorum and allowAbstain to equal the base
     * ruleset exactly, so those three are always echoed from here rather
     * than taken from the (majority-only) override form.
     */
    baseRuleset?: SetVoteRulesetResponseDto | null;
    rulesetValues?: Pick<
        CreateVoteRulesetValues,
        | "majorityRuleType"
        | "majorityDenominatorBasis"
        | "majorityThreshold"
        | "majorityComparator"
    >;
    options: VoteQuestionResponseDto["options"];
}): UpdateVoteQuestionDto {
    const {
        title,
        type,
        description,
        sortOrder,
        useCustomRuleset,
        baseRuleset,
        rulesetValues,
        options,
    } = params;

    const rulesetOverride =
        useCustomRuleset && rulesetValues && baseRuleset
            ? {
                  weightBasis: baseRuleset.weightBasis,
                  quorum: baseRuleset.quorum,
                  allowAbstain: baseRuleset.allowAbstain,
                  acknowledgedNonStatutory: baseRuleset.acknowledgedNonStatutory,
                  majorityRuleType: rulesetValues.majorityRuleType,
                  majorityDenominatorBasis:
                      rulesetValues.majorityDenominatorBasis,
                  majorityThreshold: rulesetValues.majorityThreshold,
                  majorityComparator: rulesetValues.majorityComparator,
              }
            : undefined;

    return {
        title,
        type,
        description: description || undefined,
        sortOrder,
        rulesetOverride,
        ...(type === CreateVoteQuestionDtoType.YES_NO
            ? {}
            : {
                  options: options
                      .filter((o) => !o.optionKey || o.optionKey === "CUSTOM")
                      .map((o) => ({
                          label: o.label,
                          sortOrder: o.sortOrder,
                      })),
              }),
    };
}
