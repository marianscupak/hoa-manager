import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { showApiError } from "@/api/error-utils";
import {
    CreateVoteQuestionDtoType,
    VoteDetailResponseDto,
    VoteQuestionResponseDto,
} from "@/api/generated/model";
import { useVotesControllerUpdateVoteQuestion } from "@/api/generated/votes/votes";

import { mapQuestionToUpdateDto } from "../../shared/voting-wizard.utils";
import {
    createVoteRulesetSchema,
    rulesetDefaultValues,
} from "../../steps/ruleset-step";

const questionSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    type: z.nativeEnum(CreateVoteQuestionDtoType),
    useCustomRuleset: z.boolean(),
    weightBasis: createVoteRulesetSchema.shape.weightBasis,
    quorumMeasure: createVoteRulesetSchema.shape.quorumMeasure,
    quorumElectorateBasis: createVoteRulesetSchema.shape.quorumElectorateBasis,
    quorumThreshold: createVoteRulesetSchema.shape.quorumThreshold,
    majorityRuleType: createVoteRulesetSchema.shape.majorityRuleType,
    majorityThreshold: createVoteRulesetSchema.shape.majorityThreshold,
    allowAbstain: createVoteRulesetSchema.shape.allowAbstain,
    abstainExcludedFromMajorityDenominator:
        createVoteRulesetSchema.shape.abstainExcludedFromMajorityDenominator,
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
                  }
                : rulesetDefaultValues),
        },
    });

    const updateMutation = useVotesControllerUpdateVoteQuestion();

    // Sync form with external updates to question (e.g., from other users or reorders)
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
                      }
                    : rulesetDefaultValues),
            });
        }
    }, [question, form, hasOverride]);

    const handleSave = (forcedValues?: QuestionFormValues) => {
        const values = forcedValues || form.getValues();

        const hasChanged =
            values.title !== question.title ||
            values.description !== (question.description ?? "") ||
            values.type !== question.type ||
            values.useCustomRuleset !== hasOverride;

        if (!forcedValues && !hasChanged) return;

        const data = mapQuestionToUpdateDto({
            title: values.title,
            type: values.type,
            description: values.description,
            sortOrder: question.sortOrder,
            useCustomRuleset: values.useCustomRuleset,
            rulesetValues: values,
            options: question.options,
        });

        updateMutation.mutate(
            {
                id: vote.id,
                questionId: question.id,
                data,
            },
            {
                onSuccess: () => {
                    form.reset(values);
                    onRefresh();
                },
                onError: showApiError,
            },
        );
    };

    const handleBlurSave = () => handleSave();

    return {
        form,
        handleSave,
        handleBlurSave,
        isUpdating: updateMutation.isPending,
        hasOverride,
    };
}
