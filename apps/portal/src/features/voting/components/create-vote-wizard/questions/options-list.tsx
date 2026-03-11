import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import {
    CreateVoteQuestionDtoType,
    VoteQuestionResponseDto,
} from "@/api/generated/model";
import { useVotesControllerUpdateVoteQuestion } from "@/api/generated/votes/votes";

import { OptionItem } from "./option-item";

interface OptionsListProps {
    voteId: string;
    question: VoteQuestionResponseDto;
    onRefresh: () => void;
}

export function OptionsList({ voteId, question, onRefresh }: OptionsListProps) {
    const { t } = useTranslation(["voting"]);
    const { watch } = useFormContext();
    const type = watch("type");

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    const updateQuestionMutation = useVotesControllerUpdateVoteQuestion();

    const isSingleChoice = type === CreateVoteQuestionDtoType.SINGLE_CHOICE;
    const options = [...(question.options ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder,
    );

    const handleUpdateOptions = (
        newOptions: { label: string; sortOrder: number; optionKey?: string }[],
    ) => {
        // Only send CUSTOM options to the API
        // If an option doesn't have a key yet, it's a new custom option
        const customOptions = newOptions
            .filter((opt) => !opt.optionKey || opt.optionKey === "CUSTOM")
            .map((opt) => ({
                label: opt.label.trim(),
                sortOrder: opt.sortOrder,
            }));

        updateQuestionMutation.mutate(
            {
                id: voteId,
                questionId: question.id,
                data: {
                    title: String(question.title),
                    type: question.type as CreateVoteQuestionDtoType,
                    description: typeof question.description === 'string' ? question.description : undefined,
                    sortOrder: question.sortOrder,
                    options: customOptions,
                },
            },
            {
                onSuccess: onRefresh,
                onError: (err) => showApiError(err),
            },
        );
    };

    const handleAddOption = () => {
        const defaultLabel = t(
            "voting:create.steps.questions.options.defaultLabel",
        ) as string;
        const customOptions = options.filter((o) => o.optionKey === "CUSTOM");
        const newOptions = [
            ...customOptions.map((o) => ({
                label: o.label,
                sortOrder: o.sortOrder,
            })),
            {
                label: defaultLabel,
                sortOrder: customOptions.length + 1,
            },
        ];
        handleUpdateOptions(newOptions);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = options.findIndex((o) => o.id === active.id);
            const newIndex = options.findIndex((o) => o.id === over.id);
            const reordered = arrayMove(options, oldIndex, newIndex).map(
                (o, idx) => ({
                    label: o.label,
                    sortOrder: idx + 1,
                }),
            );
            handleUpdateOptions(reordered);
        }
    };

    const handleOptionChange = (id: string, label: string) => {
        const newOptions = options.map((o) =>
            o.id === id
                ? { label, sortOrder: o.sortOrder, optionKey: o.optionKey }
                : {
                      label: o.label,
                      sortOrder: o.sortOrder,
                      optionKey: o.optionKey,
                  },
        );
        handleUpdateOptions(newOptions);
    };

    const handleOptionDelete = (id: string) => {
        const newOptions = options.filter((o) => o.id !== id);
        handleUpdateOptions(newOptions);
    };

    if (!isSingleChoice) {
        return (
            <div className="mt-4 space-y-2 border-t pt-4">
                <h4 className="text-sm font-medium">
                    {t("voting:create.steps.questions.options.title")}
                </h4>
                <div className="space-y-2 opacity-70">
                    {options.map((option) => (
                        <div
                            key={option.id}
                            className="bg-muted rounded px-3 py-2 text-sm"
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                    {t("voting:create.steps.questions.options.title")}
                </h4>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddOption}
                    type="button"
                >
                    <Plus className="mr-1 h-3 w-3" />
                    {t("voting:create.steps.questions.options.addOption")}
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={options.map((o) => o.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {options.map((option) => (
                            <OptionItem
                                key={option.id}
                                option={option}
                                onLabelChange={(label) =>
                                    handleOptionChange(option.id, label)
                                }
                                onDelete={() => handleOptionDelete(option.id)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
