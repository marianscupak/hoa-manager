import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, CSSProperties } from "react";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn, FormInput, FormSelect } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import {
    CreateVoteQuestionDtoType,
    VoteDetailResponseDto,
    VoteQuestionResponseDto,
} from "@/api/generated/model";
import { useVotesControllerDeleteVoteQuestion } from "@/api/generated/votes/votes";

import { QuestionHeader } from "./components/question-header";
import { QuestionRulesetOverride } from "./components/question-ruleset-override";
import { useQuestionForm } from "./hooks/use-question-form";
import { OptionsList } from "./options-list";

interface QuestionBlockProps {
    vote: VoteDetailResponseDto;
    question: VoteQuestionResponseDto;
    onRefresh: () => void;
}

export function QuestionBlock({
    vote,
    question,
    onRefresh,
}: QuestionBlockProps) {
    const { t } = useTranslation(["voting"]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isOverrideVisible, setIsOverrideVisible] = useState(false);

    const { form, handleSave, handleBlurSave, isUpdating, hasOverride } =
        useQuestionForm({ vote, question, onRefresh });

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    const deleteMutation = useVotesControllerDeleteVoteQuestion();

    const handleDelete = () => {
        deleteMutation.mutate(
            {
                id: vote.id,
                questionId: question.id,
            },
            {
                onSuccess: () => onRefresh(),
                onError: showApiError,
            },
        );
    };

    const handleApplyCustomRules = () => {
        form.setValue("useCustomRuleset", true);
        handleSave(form.getValues());
    };

    const handleRemoveOverride = () => {
        form.setValue("useCustomRuleset", false, { shouldDirty: true });
        setIsOverrideVisible(false);
        handleSave({
            ...form.getValues(),
            useCustomRuleset: false,
        });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "bg-card rounded-lg border shadow-sm transition-shadow",
                isDragging &&
                    "border-primary scale-[1.02] opacity-50 shadow-lg",
            )}
        >
            <QuestionHeader
                title={form.watch("title")}
                hasOverride={hasOverride}
                isExpanded={isExpanded}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
                dragAttributes={attributes}
                dragListeners={listeners}
            />

            {isExpanded && (
                <div className="space-y-4 p-4">
                    <FormProvider {...form}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormInput
                                name="title"
                                label={t(
                                    "voting:create.steps.questions.fields.title.label",
                                )}
                                placeholder={t(
                                    "voting:create.steps.questions.fields.title.placeholder",
                                )}
                                onBlur={handleBlurSave}
                            />

                            <FormSelect
                                name="type"
                                label={t(
                                    "voting:create.steps.questions.fields.type.label",
                                )}
                                options={[
                                    {
                                        label: t(
                                            "voting:create.steps.questions.fields.type.options.YES_NO",
                                        ),
                                        value: CreateVoteQuestionDtoType.YES_NO,
                                    },
                                    {
                                        label: t(
                                            "voting:create.steps.questions.fields.type.options.SINGLE_CHOICE",
                                        ),
                                        value: CreateVoteQuestionDtoType.SINGLE_CHOICE,
                                    },
                                ]}
                                onValueChange={(val) =>
                                    handleSave({
                                        ...form.getValues(),
                                        type: val as CreateVoteQuestionDtoType,
                                    })
                                }
                            />
                        </div>

                        <FormInput
                            name="description"
                            label={t(
                                "voting:create.steps.questions.fields.description.label",
                            )}
                            placeholder={t(
                                "voting:create.steps.questions.fields.description.placeholder",
                            )}
                            onBlur={handleBlurSave}
                        />

                        <OptionsList
                            voteId={vote.id}
                            question={question}
                            onRefresh={onRefresh}
                        />

                        <QuestionRulesetOverride
                            hasOverride={hasOverride}
                            isOverrideVisible={isOverrideVisible}
                            onToggleVisibility={() =>
                                setIsOverrideVisible(!isOverrideVisible)
                            }
                            onApplyCustomRules={handleApplyCustomRules}
                            onUpdateRuleset={() => handleSave(form.getValues())}
                            onRemoveOverride={handleRemoveOverride}
                            isUpdating={isUpdating}
                        />
                    </FormProvider>
                </div>
            )}
        </div>
    );
}
