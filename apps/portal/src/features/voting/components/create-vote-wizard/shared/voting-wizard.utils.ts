import {
    CreateVoteQuestionDtoType,
    SetVoteRulesetDtoMajorityRuleType as MajorityRuleType,
    SetVoteRulesetDtoQuorumElectorateBasis as QuorumElectorateBasis,
    SetVoteRulesetDtoQuorumMeasure as QuorumMeasure,
    SetVoteRulesetDtoWeightBasis as VoteWeightBasis,
    UpdateVoteQuestionDto,
    VoteQuestionResponseDto,
} from "@/api/generated/model";

/**
 * Shared utility to build the UpdateVoteQuestionDto from form values or existing question data.
 * Ensures consistent handling of numeric fields and ruleset overrides.
 */
export function mapQuestionToUpdateDto(params: {
    title: string;
    type: CreateVoteQuestionDtoType;
    description?: string;
    sortOrder: number;
    useCustomRuleset?: boolean;
    rulesetValues?: {
        weightBasis: VoteWeightBasis;
        quorumMeasure: QuorumMeasure;
        quorumElectorateBasis: QuorumElectorateBasis;
        quorumThreshold: number | string;
        majorityRuleType: MajorityRuleType;
        majorityThreshold?: number | string | null;
        allowAbstain: boolean;
        abstainExcludedFromMajorityDenominator: boolean;
    };
    options: VoteQuestionResponseDto["options"];
}): UpdateVoteQuestionDto {
    const {
        title,
        type,
        description,
        sortOrder,
        useCustomRuleset,
        rulesetValues,
        options,
    } = params;

    const rulesetOverride =
        useCustomRuleset && rulesetValues
            ? {
                  weightBasis: rulesetValues.weightBasis,
                  quorumMeasure: rulesetValues.quorumMeasure,
                  quorumElectorateBasis: rulesetValues.quorumElectorateBasis,
                  quorumThreshold: Number(rulesetValues.quorumThreshold),
                  majorityRuleType: rulesetValues.majorityRuleType,
                  majorityThreshold:
                      rulesetValues.majorityThreshold !== undefined &&
                      rulesetValues.majorityThreshold !== null &&
                      String(rulesetValues.majorityThreshold) !== ""
                          ? Number(rulesetValues.majorityThreshold)
                          : undefined,
                  allowAbstain: rulesetValues.allowAbstain,
                  abstainExcludedFromMajorityDenominator:
                      rulesetValues.abstainExcludedFromMajorityDenominator,
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
                      .filter((o) => o.optionKey === "CUSTOM")
                      .map((o) => ({
                          label: o.label,
                          sortOrder: o.sortOrder,
                      })),
              }),
    };
}
