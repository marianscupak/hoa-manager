import { z } from "zod";

const fractionSchema = z.object({
    num: z.number().int().min(1),
    den: z.number().int().min(1),
});
const comparatorSchema = z.enum(["STRICT_GREATER", "AT_LEAST"]);

const rulesetObjectSchema = z.object({
    weightBasis: z.enum(["UNIT_SHARE", "ONE_UNIT_ONE_VOTE"]),
    quorum: z
        .object({
            measure: z.enum(["UNIT_SHARE", "UNIT_COUNT"]),
            threshold: fractionSchema,
            comparator: comparatorSchema,
        })
        .nullable(),
    majorityRuleType: z.enum([
        "SIMPLE_MAJORITY",
        "QUALIFIED_MAJORITY",
        "UNANIMITY",
    ]),
    majorityDenominatorBasis: z.enum(["VOTES_CAST", "ALL_VOTES"]),
    majorityThreshold: fractionSchema.optional(),
    majorityComparator: comparatorSchema.optional(),
    allowAbstain: z.boolean(),
    acknowledgedNonStatutory: z.boolean(),
});

export const createVoteRulesetSchema = rulesetObjectSchema.superRefine(
    (data, ctx) => {
        if (
            data.majorityRuleType === "QUALIFIED_MAJORITY" &&
            (!data.majorityThreshold || !data.majorityComparator)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "voting:create.fields.majorityThreshold.errors.requiredForQualified",
                path: ["majorityThreshold"],
            });
        }
    },
);

/**
 * The plain (pre-`superRefine`) object schema's field shapes, for callers
 * that need to compose individual fields into a larger schema (e.g. the
 * per-question override form in use-question-form.ts). `createVoteRulesetSchema`
 * itself is a `ZodEffects` once wrapped in `.superRefine`, which drops the
 * `.shape` accessor.
 */
export const rulesetFieldSchemas = rulesetObjectSchema.shape;

export type CreateVoteRulesetValues = z.infer<typeof createVoteRulesetSchema>;
export { PER_ROLLAM_PRESET as rulesetDefaultValues } from "./ruleset-legal";
