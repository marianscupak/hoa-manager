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

import {
    createVoteRulesetSchema,
    majorityThresholdRefinement,
    rulesetDefaultValues,
} from "../../shared/ruleset-schema";
import { mapQuestionToUpdateDto } from "../../shared/voting-wizard.utils";

const questionSchema = z
    .object({
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.nativeEnum(CreateVoteQuestionDtoType),
        useCustomRuleset: z.boolean(),
        weightBasis: createVoteRulesetSchema.shape.weightBasis,
        quorumMeasure: createVoteRulesetSchema.shape.quorumMeasure,
        quorumElectorateBasis:
            createVoteRulesetSchema.shape.quorumElectorateBasis,
        quorumThreshold: createVoteRulesetSchema.shape.quorumThreshold,
        majorityRuleType: createVoteRulesetSchema.shape.majorityRuleType,
        majorityThreshold: createVoteRulesetSchema.shape.majorityThreshold,
        allowAbstain: createVoteRulesetSchema.shape.allowAbstain,
        abstainExcludedFromMajorityDenominator:
            createVoteRulesetSchema.shape
                .abstainExcludedFromMajorityDenominator,
        allowCoOwnerIndividualVote:
            createVoteRulesetSchema.shape.allowCoOwnerIndividualVote,
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
        if (data.useCustomRuleset) {
            majorityThresholdRefinement(data, ctx);
        }
    });

export type QuestionFormValues = z.infer<typeof questionSchema>;

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
            ...(hasOverride
                ? {
                      weightBasis: question.rulesetOverride!.weightBasis,
                      quorumMeasure: question.rulesetOverride!.quorumMeasure,
                      quorumElectorateBasis:
                          question.rulesetOverride!.quorumElectorateBasis,
                      quorumThreshold:
                          question.rulesetOverride!.quorumThreshold,
                      majorityRuleType:
                          question.rulesetOverride!.majorityRuleType,
                      majorityThreshold:
                          question.rulesetOverride!.majorityThreshold ??
                          undefined,
                      allowAbstain: question.rulesetOverride!.allowAbstain,
                      abstainExcludedFromMajorityDenominator:
                          question.rulesetOverride!
                              .abstainExcludedFromMajorityDenominator,
                      allowCoOwnerIndividualVote:
                          question.rulesetOverride!.allowCoOwnerIndividualVote,
                  }
                : rulesetDefaultValues),
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
                ...(hasOverride
                    ? {
                          weightBasis: question.rulesetOverride!.weightBasis,
                          quorumMeasure:
                              question.rulesetOverride!.quorumMeasure,
                          quorumElectorateBasis:
                              question.rulesetOverride!.quorumElectorateBasis,
                          quorumThreshold:
                              question.rulesetOverride!.quorumThreshold,
                          majorityRuleType:
                              question.rulesetOverride!.majorityRuleType,
                          majorityThreshold:
                              question.rulesetOverride!.majorityThreshold ??
                              undefined,
                          allowAbstain: question.rulesetOverride!.allowAbstain,
                          abstainExcludedFromMajorityDenominator:
                              question.rulesetOverride!
                                  .abstainExcludedFromMajorityDenominator,
                          allowCoOwnerIndividualVote:
                              question.rulesetOverride!
                                  .allowCoOwnerIndividualVote,
                      }
                    : rulesetDefaultValues),
                options: (question.options ?? []).map((o) => ({
                    id: o.id,
                    label: o.label,
                    sortOrder: o.sortOrder,
                    optionKey: (o.optionKey as string) || "CUSTOM",
                })),
            });
        }
    }, [question, form, hasOverride]);

    const type = form.watch("type");
    const allowAbstain = form.watch("allowAbstain");
    const useCustomRuleset = form.watch("useCustomRuleset");

    useEffect(() => {
        const currentOptions = form.getValues("options") || [];
        const customOptions = currentOptions.filter(
            (o) => o.optionKey === "CUSTOM" || !o.optionKey,
        );

        const effectiveAllowAbstain = useCustomRuleset
            ? allowAbstain
            : vote.ruleset?.allowAbstain ?? false;

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
        allowAbstain,
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
