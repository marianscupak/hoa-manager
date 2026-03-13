import { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { ChevronDown, ChevronUp, GripVertical, Settings2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@hoa-mngr/ui";

interface QuestionHeaderProps {
    title: string;
    hasOverride: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onDelete: () => void;
    isDeleting: boolean;
    dragAttributes: DraggableAttributes;
    dragListeners: DraggableSyntheticListeners;
}

export function QuestionHeader({
    title,
    hasOverride,
    isExpanded,
    onToggleExpand,
    onDelete,
    isDeleting,
    dragAttributes,
    dragListeners,
}: QuestionHeaderProps) {
    const { t } = useTranslation(["voting"]);

    return (
        <div className="flex items-center gap-2 border-b p-3">
            <button
                {...dragAttributes}
                {...dragListeners}
                className="text-muted-foreground hover:text-foreground cursor-grab p-1 active:cursor-grabbing"
            >
                <GripVertical className="h-4 w-4" />
            </button>

            <div className="flex-1 truncate font-medium">
                {title || t("voting:create.steps.questions.defaultTitle")}
            </div>

            <div className="flex items-center gap-1">
                {hasOverride && (
                    <div className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                        <Settings2 className="h-3 w-3" />
                        {t("voting:create.steps.questions.override.badge")}
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleExpand}
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
