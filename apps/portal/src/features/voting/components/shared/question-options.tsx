import type { TFunction } from "i18next";
import { Check, Minus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@hoa-mngr/ui/lib/utils";

import type { VoteOptionResponseDto } from "@/api/generated/model";

// ── Option Icon ────────────────────────────────────────────
export function OptionIcon({
    optionKey,
    className,
}: {
    optionKey: string;
    className?: string;
}) {
    if (optionKey === "YES")
        return <Check className={cn("text-success h-6 w-6", className)} />;
    if (optionKey === "NO")
        return <X className={cn("text-destructive h-6 w-6", className)} />;
    if (optionKey === "ABSTAIN")
        return <Minus className={cn("text-faint h-6 w-6", className)} />;
    return null;
}

export function getOptionLabel(
    optionKey: string,
    label: string,
    t: TFunction<"voting">,
) {
    if (optionKey === "YES") return t("castVote.options.yes");
    if (optionKey === "NO") return t("castVote.options.no");
    if (optionKey === "ABSTAIN") return t("castVote.options.abstain");
    return label;
}

export function QuestionOptionGrid({
    options,
    selectedOptionId,
    onSelect,
}: {
    options: VoteOptionResponseDto[];
    selectedOptionId: string | undefined;
    onSelect: (optionId: string) => void;
}) {
    const { t } = useTranslation("voting");

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                return (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onSelect(option.id)}
                        className={cn(
                            "focus-visible:ring-ring flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                            isSelected
                                ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                                : "border-border bg-card hover:bg-muted/50",
                        )}
                    >
                        {option.optionKey === "CUSTOM" ? (
                            <span className="bg-muted text-secondary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                                {option.sortOrder}
                            </span>
                        ) : (
                            <OptionIcon
                                optionKey={option.optionKey}
                                className="h-7 w-7"
                            />
                        )}
                        <span className="text-secondary-foreground text-sm font-medium">
                            {getOptionLabel(option.optionKey, option.label, t)}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
