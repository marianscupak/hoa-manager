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
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@hoa-mngr/ui";

import {
    CreateVoteQuestionDtoType,
    VoteOptionResponseDto,
} from "@/api/generated/model";

import { QuestionFormValues } from "./hooks/use-question-form";
import { OptionItem } from "./option-item";

export function OptionsList() {
    const { t } = useTranslation(["voting"]);
    const { watch, control, getValues, setValue } =
        useFormContext<QuestionFormValues>();
    const type = watch("type");

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "options",
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    const isSingleChoice = type === CreateVoteQuestionDtoType.SINGLE_CHOICE;

    const customOptions = fields.filter((o) => o.optionKey === "CUSTOM");
    const systemOptions = fields.filter(
        (o) => o.optionKey && o.optionKey !== "CUSTOM",
    );

    const getOptionLabel = (o: { label: string; optionKey?: string }) => {
        if (o.optionKey && o.optionKey !== "CUSTOM") {
            return t(`voting:create.optionLabels.${o.optionKey}`, {
                defaultValue: o.label,
            });
        }
        return o.label;
    };

    const handleAddOption = () => {
        const defaultLabel = t(
            "voting:create.steps.questions.options.defaultLabel",
        ) as string;
        append({
            label: defaultLabel,
            sortOrder: customOptions.length + 1,
            optionKey: "CUSTOM",
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((o) => o.id === active.id);
            const newIndex = fields.findIndex((o) => o.id === over.id);

            if (
                fields[oldIndex].optionKey !== "CUSTOM" ||
                fields[newIndex].optionKey !== "CUSTOM"
            ) {
                return;
            }

            const currentOptions = getValues("options") || [];
            const newOptions = [...currentOptions];
            const [movedItem] = newOptions.splice(oldIndex, 1);
            newOptions.splice(newIndex, 0, movedItem);

            // Re-calculate sortOrder for ALL options to keep them consistent
            const updatedOptions = newOptions.map((o, index) => ({
                ...o,
                sortOrder: index + 1,
            }));

            setValue("options", updatedOptions);
        }
    };

    const handleOptionChange = (id: string, label: string) => {
        const index = fields.findIndex((o) => o.id === id);
        if (index !== -1) {
            update(index, {
                ...fields[index],
                label,
            });
        }
    };

    const handleOptionDelete = (id: string) => {
        const index = fields.findIndex((o) => o.id === id);
        if (index !== -1) {
            remove(index);
        }
    };

    if (!isSingleChoice) {
        return (
            <div className="mt-4 space-y-2 border-t pt-4">
                <h4 className="text-sm font-medium">
                    {t("voting:create.steps.questions.options.title")}
                </h4>
                <div className="space-y-2 opacity-70">
                    {fields.map((option) => (
                        <div
                            key={option.id}
                            className="bg-muted rounded px-3 py-2 text-sm"
                        >
                            {getOptionLabel(option)}
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
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {t("voting:create.steps.questions.options.addOption")}
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={customOptions.map((o) => o.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {customOptions.map((option) => (
                            <OptionItem
                                key={option.id}
                                option={option as VoteOptionResponseDto}
                                onLabelChange={(label) =>
                                    handleOptionChange(option.id, label)
                                }
                                onDelete={() => handleOptionDelete(option.id)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {systemOptions.length > 0 && (
                <div className="space-y-2 opacity-70">
                    {systemOptions.map((option) => (
                        <div
                            key={option.id}
                            className="bg-muted rounded px-3 py-2 text-sm italic"
                        >
                            {getOptionLabel(option)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
