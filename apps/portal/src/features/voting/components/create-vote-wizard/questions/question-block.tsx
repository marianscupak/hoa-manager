import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button, cn, FormInput, FormSelect } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import {
    CreateVoteQuestionDtoType,
    VoteDetailResponseDto,
    VoteQuestionResponseDto,
} from "@/api/generated/model";
import {
    useVotesControllerDeleteVoteQuestion,
    useVotesControllerUpdateVoteQuestion,
} from "@/api/generated/votes/votes";

import { OptionsList } from "./options-list";

const questionSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    type: z.nativeEnum(CreateVoteQuestionDtoType),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

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

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    const form = useForm<QuestionFormValues>({
        resolver: zodResolver(questionSchema),
        defaultValues: {
            title: question.title,
            description: question.description ?? "",
            type: question.type as CreateVoteQuestionDtoType,
        },
    });

    useEffect(() => {
        if (!form.formState.isDirty) {
            form.reset({
                title: question.title,
                description:
                    typeof question.description === "string"
                        ? question.description
                        : "",
                type: question.type as CreateVoteQuestionDtoType,
            });
        }
    }, [question, form]);

    const updateMutation = useVotesControllerUpdateVoteQuestion();
    const deleteMutation = useVotesControllerDeleteVoteQuestion();

    const handleSave = (forcedValues?: QuestionFormValues) => {
        const values = forcedValues || form.getValues();

        // Manual check for changes instead of relying on isDirty
        // which can be flaky for the first save after creation
        const hasChanged =
            values.title !== question.title ||
            values.description !==
                (typeof question.description === "string"
                    ? question.description
                    : "") ||
            values.type !== question.type;

        if (!forcedValues && !hasChanged) return;

        updateMutation.mutate(
            {
                id: vote.id,
                questionId: question.id,
                data: {
                    title: values.title,
                    type: values.type,
                    description: values.description || undefined,
                    sortOrder: question.sortOrder,
                    ...(values.type === CreateVoteQuestionDtoType.YES_NO
                        ? {}
                        : {
                              options: question.options
                                  .filter((o) => o.optionKey === "CUSTOM")
                                  .map((o) => ({
                                      label: o.label,
                                      sortOrder: o.sortOrder,
                                  })),
                          }),
                },
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

    const handleDelete = () => {
        deleteMutation.mutate(
            {
                id: vote.id,
                questionId: question.id,
            },
            {
                onSuccess: () => {
                    onRefresh();
                },
                onError: showApiError,
            },
        );
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
            <div className="flex items-center gap-2 border-b p-3">
                <button
                    {...attributes}
                    {...listeners}
                    className="text-muted-foreground hover:text-foreground cursor-grab p-1 active:cursor-grabbing"
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                <div className="flex-1 truncate font-medium">
                    {form.watch("title") ||
                        t("voting:create.steps.questions.defaultTitle")}
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(!isExpanded)}
                        type="button"
                    >
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        type="button"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

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
                                onValueChange={(val: string) =>
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
                    </FormProvider>
                </div>
            )}
        </div>
    );
}
