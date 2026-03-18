import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, CSSProperties } from "react";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
    cn,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    FormInput,
    FormSelect,
    FormTextarea,
} from "@hoa-mngr/ui";

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

interface QuestionModalProps {
    vote: VoteDetailResponseDto;
    question: VoteQuestionResponseDto;
    onRefresh: () => void;
    autoOpen?: boolean;
}

export function QuestionModal({
    vote,
    question,
    onRefresh,
    autoOpen,
}: QuestionModalProps) {
    const { t } = useTranslation(["voting"]);
    const [isModalOpen, setIsModalOpen] = useState(autoOpen ?? false);
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
                title={question.title}
                hasOverride={hasOverride}
                onEdit={() => {
                    setIsModalOpen(true);
                    setIsOverrideVisible(hasOverride);
                }}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
                dragAttributes={attributes}
                dragListeners={listeners}
            />

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t("voting:create.steps.questions.editQuestion")}
                        </DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={form.handleSubmit((values) => {
                            handleSave(values);
                            setIsModalOpen(false);
                        })}
                    >
                        <div className="space-y-4 py-4">
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
                                            form.setValue(
                                                "useCustomRuleset",
                                                true,
                                            );
                                        }
                                    }}
                                    onRemoveOverride={handleRemoveOverride}
                                />
                            </FormProvider>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    form.reset();
                                }}
                            >
                                {t("voting:common.cancel")}
                            </Button>
                            <Button type="submit" disabled={isUpdating}>
                                {t("voting:common.save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
