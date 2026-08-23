import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { showApiError } from "@/api/error-utils";
import {
    CreateVoteQuestionDtoType,
    VoteDetailResponseDto,
    VoteQuestionResponseDto,
} from "@/api/generated/model";
import { useVotesControllerUpdateVoteQuestion } from "@/api/generated/votes/votes";

import { rulesetFieldSchemas } from "../../shared/ruleset-schema";
import { mapQuestionToUpdateDto } from "../../shared/voting-wizard.utils";

const questionSchema = z
    .object({
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.nativeEnum(CreateVoteQuestionDtoType),
        useCustomRuleset: z.boolean(),
        majorityRuleType: rulesetFieldSchemas.majorityRuleType,
        majorityDenominatorBasis: rulesetFieldSchemas.majorityDenominatorBasis,
        majorityThreshold: rulesetFieldSchemas.majorityThreshold,
        majorityComparator: rulesetFieldSchemas.majorityComparator,
        options: z.array(
            z.object({
                id: z.string().optional(),
                label: z.string().min(1),
                sortOrder: z.number(),
                optionKey: z.string().optional(),
            }),
        ),
    })
    .superRefine((data, ctx) => {
        if (
            data.useCustomRuleset &&
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
    });

export type QuestionFormValues = z.infer<typeof questionSchema>;

/**
 * Majority-field defaults for the override form: the question's own
 * override when it has one, otherwise the vote's base ruleset — so turning
 * "use custom ruleset" on starts from the currently effective rule rather
 * than an unrelated hardcoded default. weightBasis/quorum/allowAbstain
 * aren't part of this form at all (see mapQuestionToUpdateDto): the server
 * requires an override to match the base ruleset on those dimensions
 * exactly, so they're echoed from vote.ruleset at submit time instead.
 */
function majorityDefaults(
    vote: VoteDetailResponseDto,
    question: VoteQuestionResponseDto,
) {
    const source = question.rulesetOverride ?? vote.ruleset;
    return {
        majorityRuleType: source?.majorityRuleType ?? "SIMPLE_MAJORITY",
        majorityDenominatorBasis:
            source?.majorityDenominatorBasis ?? "ALL_VOTES",
        majorityThreshold: source?.majorityThreshold ?? undefined,
        majorityComparator: source?.majorityComparator ?? undefined,
    };
}

interface UseQuestionFormParams {
    vote: VoteDetailResponseDto;
    question: VoteQuestionResponseDto;
    onRefresh: () => void;
}

export function useQuestionForm({
    vote,
    question,
    onRefresh,
}: UseQuestionFormParams) {
    const { t } = useTranslation(["voting"]);
    const hasOverride = !!question.rulesetOverride;

    const form = useForm<QuestionFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(questionSchema) as any,
        defaultValues: {
            title: question.title,
            description: question.description ?? "",
            type: question.type as CreateVoteQuestionDtoType,
            useCustomRuleset: hasOverride,
            ...majorityDefaults(vote, question),
            options: (question.options ?? []).map((o) => ({
                id: o.id,
                label: o.label,
                sortOrder: o.sortOrder,
                optionKey: (o.optionKey as string) || "CUSTOM",
            })),
        },
    });

    const updateMutation = useVotesControllerUpdateVoteQuestion();

    useEffect(() => {
        if (!form.formState.isDirty) {
            form.reset({
                title: question.title,
                description: question.description ?? "",
                type: question.type as CreateVoteQuestionDtoType,
                useCustomRuleset: hasOverride,
                ...majorityDefaults(vote, question),
                options: (question.options ?? []).map((o) => ({
                    id: o.id,
                    label: o.label,
                    sortOrder: o.sortOrder,
                    optionKey: (o.optionKey as string) || "CUSTOM",
                })),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question, form, hasOverride]);

    const type = form.watch("type");
    const useCustomRuleset = form.watch("useCustomRuleset");

    useEffect(() => {
        const currentOptions = form.getValues("options") || [];
        const customOptions = currentOptions.filter(
            (o) => o.optionKey === "CUSTOM" || !o.optionKey,
        );

        // allowAbstain is vote-level: an override can never change it (the
        // server requires override.allowAbstain === base.allowAbstain), so
        // the effective value is always the base ruleset's, regardless of
        // useCustomRuleset.
        const effectiveAllowAbstain = vote.ruleset?.allowAbstain ?? false;

        if (type === CreateVoteQuestionDtoType.YES_NO) {
            const systemOptions = [
                { label: "For", sortOrder: 1, optionKey: "YES" },
                { label: "Against", sortOrder: 2, optionKey: "NO" },
            ];

            if (effectiveAllowAbstain) {
                systemOptions.push({
                    label: "Abstain",
                    sortOrder: 3,
                    optionKey: "ABSTAIN",
                });
            }

            const currentSystemKeys = currentOptions
                .filter((o) => o.optionKey && o.optionKey !== "CUSTOM")
                .map((o) => o.optionKey);
            const targetSystemKeys = systemOptions.map((o) => o.optionKey);

            if (
                JSON.stringify(currentSystemKeys) !==
                JSON.stringify(targetSystemKeys)
            ) {
                form.setValue("options", [...systemOptions, ...customOptions]);
            }
        } else {
            const systemOptions = effectiveAllowAbstain
                ? [
                      {
                          label: "Abstain",
                          sortOrder: customOptions.length + 1,
                          optionKey: "ABSTAIN",
                      },
                  ]
                : [];

            const currentSystemKeys = currentOptions
                .filter((o) => o.optionKey && o.optionKey !== "CUSTOM")
                .map((o) => o.optionKey);
            const targetSystemKeys = systemOptions.map((o) => o.optionKey);

            if (
                JSON.stringify(currentSystemKeys) !==
                JSON.stringify(targetSystemKeys)
            ) {
                form.setValue("options", [...customOptions, ...systemOptions]);
            }
        }
    }, [
        type,
        useCustomRuleset,
        vote.ruleset?.allowAbstain,
        form,
    ]);

    const handleSave = (forcedValues?: QuestionFormValues) => {
        const values = forcedValues || form.getValues();

        const currentOptions = values.options.map((o) => ({
            label: o.label,
            sortOrder: o.sortOrder,
            optionKey: o.optionKey,
        }));
        const originalOptions = (question.options ?? []).map((o) => ({
            label: o.label,
            sortOrder: o.sortOrder,
            optionKey: (o.optionKey as string) || "CUSTOM",
        }));

        const optionsChanged =
            JSON.stringify(currentOptions) !== JSON.stringify(originalOptions);

        const hasChanged =
            values.title !== question.title ||
            values.description !== (question.description ?? "") ||
            values.type !== question.type ||
            values.useCustomRuleset !== hasOverride ||
            optionsChanged;

        if (!forcedValues && !hasChanged) return;

        const data = mapQuestionToUpdateDto({
            title: values.title,
            type: values.type,
            description: values.description,
            sortOrder: question.sortOrder,
            useCustomRuleset: values.useCustomRuleset,
            baseRuleset: vote.ruleset,
            rulesetValues: values,
            options: values.options as VoteQuestionResponseDto["options"],
        });

        updateMutation.mutate(
            {
                id: vote.id,
                questionId: question.id,
                data,
            },
            {
                onSuccess: () => {
                    toast.success(
                        t("voting:create.steps.questions.updateSuccess"),
                    );
                    form.reset(values);
                    onRefresh();
                },
                onError: showApiError,
            },
        );
    };

    return {
        form,
        handleSave,
        isUpdating: updateMutation.isPending,
        hasOverride,
    };
}
