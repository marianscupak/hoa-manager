import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { showApiError } from "@/api/error-utils";
import { VoteDetailResponseDto } from "@/api/generated/model";
import { useVotesControllerSetVoteRuleset } from "@/api/generated/votes/votes";
import { buildRuleSentence } from "@/features/voting/utils/rule-sentence";

import {
    ASSEMBLY_PRESET,
    PER_ROLLAM_PRESET,
    tierIssues,
} from "../shared/ruleset-legal";
import { RulesetFormFields } from "../shared/ruleset-form-fields";
import {
    createVoteRulesetSchema,
    type CreateVoteRulesetValues,
} from "../shared/ruleset-schema";

export interface CreateVoteRulesetStepProps {
    voteId: string | null;
    /** The vote's mode — immutable after creation; drives quorum visibility. */
    mode: "PER_ROLLAM" | "ASSEMBLY_RECORD";
    onSuccess: () => void;
    initialData?: VoteDetailResponseDto["ruleset"];
    /** Id the wizard footer's Continue button submits via `form={formId}`. */
    formId: string;
    onDirtyChange: (dirty: boolean) => void;
    onSavingChange?: (saving: boolean) => void;
    /**
     * Reports whether the current draft has a blocking (tier1) legal-validity
     * issue, so the wizard footer can disable Continue — the server still
     * enforces this for real (`VOTE_RULESET_SUBLEGAL`), this is purely a
     * pre-submit UX guard.
     */
    onBlockedChange?: (blocked: boolean) => void;
}

export function CreateVoteRulesetStep({
    voteId,
    mode,
    onSuccess,
    initialData,
    formId,
    onDirtyChange,
    onSavingChange,
    onBlockedChange,
}: CreateVoteRulesetStepProps) {
    const { t } = useTranslation(["voting", "errors"]);
    // buildRuleSentence requires a namespace-scoped TFunction<"voting">;
    // the array-scoped `t` above doesn't satisfy that contract.
    const { t: tVoting } = useTranslation("voting");

    // Selecting a mode in the (preceding) mode step applies its statutory
    // preset here — only relevant before any ruleset has been saved yet
    // (initialData is null); once one exists it always wins.
    const modeDefault =
        mode === "ASSEMBLY_RECORD" ? ASSEMBLY_PRESET : PER_ROLLAM_PRESET;

    const rulesetForm = useForm<CreateVoteRulesetValues>({
        resolver: zodResolver(
            createVoteRulesetSchema,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any,
        defaultValues: initialData ?? modeDefault,
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
    // Field names already match SetVoteRulesetDto 1:1, so the watched form
    // values can be handed to buildRuleSentence and the submit mutation
    // without any reshaping.
    const watchedValues = rulesetForm.watch();

    const isBlocked = tierIssues(mode, watchedValues).tier1.length > 0;

    useEffect(() => {
        onBlockedChange?.(isBlocked);
        return () => onBlockedChange?.(false);
    }, [isBlocked, onBlockedChange]);

    const onSubmit = (values: CreateVoteRulesetValues) => {
        if (!voteId) return;

        setRulesetMutation.mutate(
            {
                id: voteId,
                data: values,
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
                    <p className="text-primary text-2xs font-bold tracking-wider uppercase">
                        {t("voting:rules.inPlainLanguage")}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                        {buildRuleSentence(watchedValues, tVoting)}
                    </p>
                </div>

                <RulesetFormFields mode={mode} />
            </form>
        </FormProvider>
    );
}
