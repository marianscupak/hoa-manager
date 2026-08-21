import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, CSSProperties } from "react";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn, Button, FormInput, FormSelect, FormTextarea } from "@hoa-mngr/ui";

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
import { LegalValidityDisclaimer } from "../shared/legal-validity-disclaimer";

interface QuestionCardProps {
    vote: VoteDetailResponseDto;
    question: VoteQuestionResponseDto;
    onRefresh: () => void;
    autoOpen?: boolean;
    /**
     * 1-based position of this card in the list, for the index bubble in the
     * collapsed row. Not part of the original QuestionModal contract — added
     * because `question.sortOrder` isn't a reliable display index (drag
     * reordering only persists the moved question's sortOrder, see
     * questions-list.tsx's handleDragEnd), whereas the render index always
     * matches what's on screen.
     */
    index: number;
}

export function QuestionCard({
    vote,
    question,
    onRefresh,
    autoOpen,
    index,
}: QuestionCardProps) {
    const { t } = useTranslation(["voting"]);
    const [isEditing, setIsEditing] = useState(autoOpen ?? false);
    const { form, handleSave, isUpdating, hasOverride } = useQuestionForm({
        vote,
        question,
        onRefresh,
    });
    const [isOverrideVisible, setIsOverrideVisible] = useState(hasOverride);

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

    const handleRemoveOverride = () => {
        form.setValue("useCustomRuleset", false);
        setIsOverrideVisible(false);
    };

    const handleCancel = () => {
        form.reset();
        setIsEditing(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "bg-card rounded-lg border shadow-sm transition-shadow",
                isEditing && "border-primary border-2",
                isDragging &&
                    "border-primary scale-[1.02] opacity-50 shadow-lg",
            )}
        >
            {!isEditing ? (
                <QuestionHeader
                    index={index}
                    title={question.title}
                    hasOverride={hasOverride}
                    onEdit={() => {
                        setIsEditing(true);
                        setIsOverrideVisible(hasOverride);
                    }}
                    onDelete={handleDelete}
                    isDeleting={deleteMutation.isPending}
                    dragAttributes={attributes}
                    dragListeners={listeners}
                />
            ) : (
                <FormProvider {...form}>
                    <form
                        onSubmit={form.handleSubmit((values) => {
                            handleSave(values);
                            setIsEditing(false);
                        })}
                    >
                        <div className="space-y-4 p-4">
                            <h3 className="text-sm font-semibold">
                                {t(
                                    "voting:create.steps.questions.editQuestion",
                                )}
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormInput
                                    name="title"
                                    label={t(
                                        "voting:create.steps.questions.fields.title.label",
                                    )}
                                    placeholder={t(
                                        "voting:create.steps.questions.fields.title.placeholder",
                                    )}
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
                                />
                            </div>

                            {form.watch("type") !==
                                CreateVoteQuestionDtoType.YES_NO && (
                                <LegalValidityDisclaimer />
                            )}

                            <FormTextarea
                                name="description"
                                label={t(
                                    "voting:create.steps.questions.fields.description.label",
                                )}
                                placeholder={t(
                                    "voting:create.steps.questions.fields.description.placeholder",
                                )}
                                rows={2}
                            />

                            <OptionsList />

                            <QuestionRulesetOverride
                                hasOverride={form.watch("useCustomRuleset")}
                                isOverrideVisible={isOverrideVisible}
                                onToggleVisibility={() => {
                                    const nextVisible = !isOverrideVisible;
                                    setIsOverrideVisible(nextVisible);
                                    if (nextVisible) {
                                        form.setValue("useCustomRuleset", true);
                                    }
                                }}
                                onRemoveOverride={handleRemoveOverride}
                            />
                        </div>

                        <div className="flex justify-end gap-2 border-t p-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleCancel}
                            >
                                {t("voting:common.cancel")}
                            </Button>
                            <Button type="submit" disabled={isUpdating}>
                                {t("voting:common.save")}
                            </Button>
                        </div>
                    </form>
                </FormProvider>
            )}
        </div>
    );
}
