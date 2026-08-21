import { z } from "zod";

import {
    SetVoteRulesetDtoMajorityRuleType as MajorityRuleType,
    SetVoteRulesetDtoQuorumElectorateBasis as QuorumElectorateBasis,
    SetVoteRulesetDtoQuorumMeasure as QuorumMeasure,
    SetVoteRulesetDtoWeightBasis as VoteWeightBasis,
} from "@/api/generated/model";

export const createVoteRulesetSchema = z.object({
    weightBasis: z.nativeEnum(VoteWeightBasis),
    quorumMeasure: z.nativeEnum(QuorumMeasure),
    quorumElectorateBasis: z.nativeEnum(QuorumElectorateBasis),
    quorumThreshold: z.coerce
        .number()
        .min(0, "voting:create.fields.quorumThreshold.errors.positiveNumber")
        .max(100, "voting:create.fields.quorumThreshold.errors.max"),
    majorityRuleType: z.nativeEnum(MajorityRuleType),
    majorityThreshold: z.coerce
        .number()
        .optional()
        .refine((v) => v === undefined || (!isNaN(v) && v >= 0), {
            message:
                "voting:create.fields.majorityThreshold.errors.positiveNumber",
        })
        .refine((v) => v === undefined || (typeof v === "number" && v <= 100), {
            message: "voting:create.fields.majorityThreshold.errors.max",
        }),
    allowAbstain: z.boolean(),
    abstainExcludedFromMajorityDenominator: z.boolean(),
    allowCoOwnerIndividualVote: z.boolean(),
});

export const majorityThresholdRefinement = (
    data: {
        majorityRuleType: MajorityRuleType;
        majorityThreshold?: number | null;
    },
    ctx: z.RefinementCtx,
) => {
    if (
        data.majorityRuleType === MajorityRuleType.QUALIFIED_MAJORITY &&
        (data.majorityThreshold === undefined ||
            data.majorityThreshold === null)
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
                "voting:create.fields.majorityThreshold.errors.requiredForQualified",
            path: ["majorityThreshold"],
        });
    }
};

export type CreateVoteRulesetValues = z.infer<typeof createVoteRulesetSchema>;

export const rulesetDefaultValues: CreateVoteRulesetValues = {
    weightBasis: VoteWeightBasis.UNIT_SHARE,
    quorumMeasure: QuorumMeasure.UNIT_SHARE,
    quorumElectorateBasis: QuorumElectorateBasis.ALL_UNITS,
    quorumThreshold: 50,
    majorityRuleType: MajorityRuleType.SIMPLE_MAJORITY,
    majorityThreshold: undefined,
    allowAbstain: true,
    abstainExcludedFromMajorityDenominator: false,
    allowCoOwnerIndividualVote: false,
};
