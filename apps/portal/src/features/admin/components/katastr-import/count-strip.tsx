import { useTranslation } from "react-i18next";

import { Card } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type { KatastrImportPreviewResponseDto } from "@/api/generated/model";

import { hasNothingToDo } from "./messages";

/**
 * How big the change is, in five numbers. Zeroes are shown rather than
 * dropped: the strip is a fixed shape, so "0 units to create" is read as an
 * answer, where a missing figure would be read as a question.
 */
export function CountStrip({
    counts,
}: {
    counts: KatastrImportPreviewResponseDto["counts"];
}) {
    const { t } = useTranslation("katastr");

    if (hasNothingToDo(counts)) {
        return (
            <Card className="text-muted-foreground px-[18px] py-4 text-sm">
                {t("counts.nothingToDo")}
            </Card>
        );
    }

    const figures = [
        {
            value: counts.unitsCreated,
            label: t("counts.unitsCreated"),
            tone: "text-success-tint-foreground",
        },
        {
            value: counts.unitsUpdated,
            label: t("counts.unitsUpdated"),
            tone: "text-primary-tint-foreground",
        },
        {
            value: counts.unitsUnchanged,
            label: t("counts.unitsUnchanged"),
            tone: "text-foreground",
        },
        {
            value: counts.ownersCreated,
            label: t("counts.ownersCreated"),
            tone: "text-success-tint-foreground",
        },
        {
            value: counts.ownersMatched,
            label: t("counts.ownersMatched"),
            tone: "text-foreground",
        },
    ];

    return (
        <Card className="px-1 py-4">
            <dl className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-y-3">
                {figures.map((figure, index) => (
                    <div
                        key={figure.label}
                        // Reversed so the figure reads first while the
                        // label keeps its required place before the value.
                        className={cn(
                            "border-hairline flex flex-col-reverse border-l px-[18px] py-0.5",
                            index === 0 && "border-transparent",
                        )}
                    >
                        <dt className="text-muted-foreground mt-0.5 text-[12.5px] leading-[17px]">
                            {figure.label}
                        </dt>
                        <dd
                            className={cn(
                                "font-display text-stat font-extrabold tracking-[-0.5px] tabular-nums",
                                figure.tone,
                            )}
                        >
                            {figure.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </Card>
    );
}
