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
        .min(0, "voting:create.fields.quorumThreshold.errors.positiveNumber"),
    majorityRuleType: z.nativeEnum(MajorityRuleType),
    majorityThreshold: z.coerce
        .number()
        .optional()
        .refine((v) => v === undefined || (!isNaN(v) && v >= 0), {
            message:
                "voting:create.fields.majorityThreshold.errors.positiveNumber",
        }),
    allowAbstain: z.boolean(),
    abstainExcludedFromMajorityDenominator: z.boolean(),
});

export type CreateVoteRulesetValues = z.infer<typeof createVoteRulesetSchema>;

export const rulesetDefaultValues: CreateVoteRulesetValues = {
    weightBasis: VoteWeightBasis.UNIT_SHARE,
    quorumMeasure: QuorumMeasure.UNIT_SHARE,
    quorumElectorateBasis: QuorumElectorateBasis.ALL_UNITS,
    quorumThreshold: 0,
    majorityRuleType: MajorityRuleType.SIMPLE_MAJORITY,
    majorityThreshold: undefined,
    allowAbstain: false,
    abstainExcludedFromMajorityDenominator: false,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(createVoteRulesetSchema) as any,
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
                <p className="text-muted-foreground text-sm">
                    {t("voting:create.steps.ruleset.defaultDescription")}
                </p>

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
