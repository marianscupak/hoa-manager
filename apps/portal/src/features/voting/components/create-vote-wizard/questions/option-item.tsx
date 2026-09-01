import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { CSSProperties, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Input, cn } from "@hoa-mngr/ui";

import { VoteOptionResponseDto } from "@/api/generated/model";

interface OptionItemProps {
    option: VoteOptionResponseDto;
    onLabelChange: (label: string) => void;
    onDelete: () => void;
}

export function OptionItem({
    option,
    onLabelChange,
    onDelete,
}: OptionItemProps) {
    const { t } = useTranslation(["voting"]);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: option.id });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    const [value, setValue] = useState(option.label);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "bg-muted/30 flex items-center gap-2 rounded p-1 pl-2 transition-shadow",
                isDragging &&
                    "bg-muted border-primary z-10 opacity-50 shadow-md",
            )}
        >
            <button
                {...attributes}
                {...listeners}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring cursor-grab rounded-sm p-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:cursor-grabbing"
                type="button"
            >
                <GripVertical className="h-3.5 w-3.5" />
            </button>

            <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => {
                    const trimmedValue = value.trim();
                    if (trimmedValue !== option.label) {
                        onLabelChange(trimmedValue);
                    }
                }}
                className="focus-visible:ring-primary/20 h-8 border-none bg-transparent shadow-none focus-visible:ring-1"
                placeholder={t(
                    "voting:create.steps.questions.options.placeholder",
                )}
            />

            <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                onClick={onDelete}
                type="button"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}
