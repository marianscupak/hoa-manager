import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo } from "react";

import { showApiError } from "@/api/error-utils";
import { VoteDetailResponseDto } from "@/api/generated/model";
import { useVotesControllerUpdateVoteQuestion } from "@/api/generated/votes/votes";

import { QuestionBlock } from "./question-block";

interface QuestionsListProps {
    vote: VoteDetailResponseDto;
    onRefresh: () => void;
}

export function QuestionsList({ vote, onRefresh }: QuestionsListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    const updateQuestionMutation = useVotesControllerUpdateVoteQuestion();

    const questions = useMemo(() => {
        return [...(vote.questions ?? [])].sort(
            (a, b) => a.sortOrder - b.sortOrder,
        );
    }, [vote.questions]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = questions.findIndex((q) => q.id === active.id);
            const newIndex = questions.findIndex((q) => q.id === over.id);

            const movedQuestion = questions[oldIndex];

            updateQuestionMutation.mutate(
                {
                    id: vote.id,
                    questionId: active.id as string,
                    data: {
                        title: movedQuestion.title,
                        type: movedQuestion.type,
                        description: movedQuestion.description || undefined,
                        sortOrder: newIndex + 1,
                        rulesetOverride: movedQuestion.rulesetOverride
                            ? {
                                  ...movedQuestion.rulesetOverride,
                                  majorityThreshold:
                                      movedQuestion.rulesetOverride
                                          .majorityThreshold ?? undefined,
                              }
                            : undefined,
                        ...(movedQuestion.type === "SINGLE_CHOICE"
                            ? {
                                  options: movedQuestion.options
                                      .filter((o) => o.optionKey === "CUSTOM")
                                      .map((o) => ({
                                          label: o.label,
                                          sortOrder: o.sortOrder,
                                      })),
                              }
                            : {}),
                    },
                },
                {
                    onSuccess: () => onRefresh(),
                    onError: showApiError,
                },
            );
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4">
                    {questions.map((question) => (
                        <QuestionBlock
                            key={question.id}
                            vote={vote}
                            question={question}
                            onRefresh={onRefresh}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
