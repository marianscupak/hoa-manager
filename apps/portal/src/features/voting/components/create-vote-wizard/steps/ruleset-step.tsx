import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { showApiError } from "@/api/error-utils";
import {
    SetVoteRulesetResponseDto,
    VoteDetailResponseDto,
} from "@/api/generated/model";
import { useVotesControllerSetVoteRuleset } from "@/api/generated/votes/votes";
import { buildRuleSentence } from "@/features/voting/utils/rule-sentence";

import { RulesetFormFields } from "../shared/ruleset-form-fields";
import {
    createVoteRulesetSchema,
    majorityThresholdRefinement,
    rulesetDefaultValues,
    type CreateVoteRulesetValues,
} from "../shared/ruleset-schema";

export interface CreateVoteRulesetStepProps {
    voteId: string | null;
    onSuccess: () => void;
    initialData?: VoteDetailResponseDto["ruleset"];
    /** Id the wizard footer's Continue button submits via `form={formId}`. */
    formId: string;
    onDirtyChange: (dirty: boolean) => void;
    onSavingChange?: (saving: boolean) => void;
}

export function CreateVoteRulesetStep({
    voteId,
    onSuccess,
    initialData,
    formId,
    onDirtyChange,
    onSavingChange,
}: CreateVoteRulesetStepProps) {
    const { t } = useTranslation(["voting", "errors"]);
    // buildRuleSentence requires a namespace-scoped TFunction<"voting">;
    // the array-scoped `t` above doesn't satisfy that contract.
    const { t: tVoting } = useTranslation("voting");

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

    const { isDirty } = rulesetForm.formState;
    const { isPending } = setRulesetMutation;

    useEffect(() => {
        onDirtyChange(isDirty);
        return () => onDirtyChange(false);
    }, [isDirty, onDirtyChange]);

    useEffect(() => {
        onSavingChange?.(isPending);
        return () => onSavingChange?.(false);
    }, [isPending, onSavingChange]);

    // Live-updates as the user picks selection cards / toggles checkboxes.
    // Field names already match SetVoteRulesetResponseDto; numeric fields
    // are coerced since native number inputs keep string values in RHF
    // state until zod coerces them on submit (mirrors mapQuestionToUpdateDto).
    const watchedValues = rulesetForm.watch();
    const watchedValuesAsRuleset: SetVoteRulesetResponseDto = {
        ...watchedValues,
        quorumThreshold: Number(watchedValues.quorumThreshold) || 0,
        majorityThreshold:
            watchedValues.majorityThreshold !== undefined &&
            watchedValues.majorityThreshold !== null &&
            String(watchedValues.majorityThreshold) !== ""
                ? Number(watchedValues.majorityThreshold)
                : undefined,
    };

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
                id={formId}
                onSubmit={rulesetForm.handleSubmit(onSubmit)}
                className="space-y-6"
            >
                <div className="space-y-1">
                    <h1 className="font-display text-2xl font-extrabold tracking-tight">
                        {t("create.steps.ruleset.title")}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {t("create.steps.ruleset.description")}
                    </p>
                    <p className="text-muted-foreground text-sm italic">
                        {t("voting:create.steps.ruleset.defaultDescription")}
                    </p>
                </div>

                <div className="rounded-panel bg-primary-tint border-primary-tint-border border p-4">
                    <p className="text-primary text-[11px] font-bold tracking-wider uppercase">
                        {t("voting:rules.inPlainLanguage")}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                        {buildRuleSentence(watchedValuesAsRuleset, tVoting)}
                    </p>
                </div>

                <RulesetFormFields />
            </form>
        </FormProvider>
    );
}
