import {
    DraggableAttributes,
    DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { GripVertical, Pencil, Settings2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, StatusChip } from "@hoa-mngr/ui";

interface QuestionHeaderProps {
    index: number;
    title: string;
    hasOverride: boolean;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting: boolean;
    dragAttributes: DraggableAttributes;
    dragListeners: DraggableSyntheticListeners;
}

export function QuestionHeader({
    index,
    title,
    hasOverride,
    onEdit,
    onDelete,
    isDeleting,
    dragAttributes,
    dragListeners,
}: QuestionHeaderProps) {
    const { t } = useTranslation(["voting"]);

    return (
        <div className="flex items-center gap-2 p-3">
            <button
                {...dragAttributes}
                {...dragListeners}
                type="button"
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring cursor-grab rounded-sm p-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:cursor-grabbing"
            >
                <GripVertical className="h-4 w-4" />
            </button>

            <span className="text-muted-foreground w-4 shrink-0 text-center text-xs font-bold">
                {index}
            </span>

            <div className="flex-1 truncate font-medium">
                {title || t("voting:create.steps.questions.defaultTitle")}
            </div>

            <div className="flex items-center gap-1">
                {hasOverride && (
                    <StatusChip variant="primary" dot={false}>
                        <Settings2 className="h-3.5 w-3.5" />
                        {t("voting:create.steps.questions.override.badge")}
                    </StatusChip>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    type="button"
                    className="h-8 gap-1 px-2 text-xs"
                >
                    <Pencil className="h-3.5 w-3.5" />
                    {t("voting:create.steps.questions.actions.edit")}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onDelete}
                    disabled={isDeleting}
                    type="button"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
