import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import {
    SetVoteRulesetDtoMajorityRuleType as MajorityRuleType,
    SetVoteRulesetDtoQuorumElectorateBasis as QuorumElectorateBasis,
    SetVoteRulesetDtoQuorumMeasure as QuorumMeasure,
    SetVoteRulesetDtoWeightBasis as VoteWeightBasis,
    VoteDetailResponseDto,
} from "@/api/generated/model";
import { useVotesControllerSetVoteRuleset } from "@/api/generated/votes/votes";

import { RulesetFormFields } from "../shared/ruleset-form-fields";

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

export interface CreateVoteRulesetStepProps {
    voteId: string | null;
    onSuccess: () => void;
    initialData?: VoteDetailResponseDto["ruleset"];
}

export function CreateVoteRulesetStep({
    voteId,
    onSuccess,
    initialData,
}: CreateVoteRulesetStepProps) {
    const { t } = useTranslation(["voting", "errors"]);

    const rulesetForm = useForm<CreateVoteRulesetValues>({
        resolver: zodResolver(
            createVoteRulesetSchema.superRefine(majorityThresholdRefinement),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any,
        defaultValues: initialData ?? rulesetDefaultValues,
    });

    useEffect(() => {
        if (initialData && !rulesetForm.formState.isDirty) {
            rulesetForm.reset(initialData);
        }
    }, [initialData, rulesetForm]);

    const setRulesetMutation = useVotesControllerSetVoteRuleset();

    const onSubmit = (values: CreateVoteRulesetValues) => {
        if (!voteId) return;

        setRulesetMutation.mutate(
            {
                id: voteId,
                data: {
                    ...values,
                    majorityThreshold: values.majorityThreshold ?? undefined,
                },
            },
            {
                onSuccess: () => {
                    toast.success(t("voting:create.toast.rulesetSuccess"));
                    rulesetForm.reset(values);
                    onSuccess();
                },
                onError: showApiError,
            },
        );
    };

    return (
        <FormProvider {...rulesetForm}>
            <form
                onSubmit={rulesetForm.handleSubmit(onSubmit)}
                className="space-y-6"
            >
                <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">
                        {t("create.steps.ruleset.description")}
                    </p>
                    <p className="text-muted-foreground text-sm italic">
                        {t("voting:create.steps.ruleset.defaultDescription")}
                    </p>
                </div>

                <RulesetFormFields />

                <div className="flex justify-end space-x-4 pt-4">
                    <Button
                        type="submit"
                        disabled={setRulesetMutation.isPending}
                    >
                        {setRulesetMutation.isPending
                            ? "..."
                            : t("voting:create.actions.saveNext")}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
