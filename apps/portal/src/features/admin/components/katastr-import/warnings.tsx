import { AlertTriangleIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { KatastrImportPreviewResponseDto } from "@/api/generated/model";

import { messageKeyFor } from "./messages";

type PreviewWarning = KatastrImportPreviewResponseDto["warnings"][number];

/**
 * A `NAME_MATCH` warning says the same thing as the amber "Matched by
 * name" chip and the "→ existing name" beside it in the owners list, where
 * the admin is already looking at the pair being matched. Repeating it as
 * a sentence here would be noise; everything else still needs a home.
 */
function needsItsOwnLine(warning: PreviewWarning): boolean {
    return warning.code !== "NAME_MATCH";
}

export function Warnings({
    warnings,
}: {
    warnings: KatastrImportPreviewResponseDto["warnings"];
}) {
    const { t } = useTranslation("katastr");
    const listed = warnings.filter(needsItsOwnLine);
    if (listed.length === 0) return null;

    return (
        <section className="border-warning-tint-border bg-warning-muted rounded-card shadow-clay-card-amber border px-[18px] py-4">
            <h2 className="text-warning-tint-foreground flex items-center gap-2 text-[14.5px] font-bold">
                <AlertTriangleIcon aria-hidden className="h-[15px] w-[15px]" />
                {t("warnings.heading")}
            </h2>
            <ul className="mt-2.5 flex flex-col gap-2">
                {listed.map((warning, index) => (
                    <li
                        key={`${warning.code}-${index}`}
                        className="text-warning-deep text-detail flex gap-2.5 leading-[19px]"
                    >
                        <span
                            aria-hidden
                            className="bg-warning mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full"
                        />
                        <span>
                            {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                t(
                                    messageKeyFor(
                                        "warnings",
                                        warning.code,
                                    ) as any,
                                    warning,
                                )
                            }
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
