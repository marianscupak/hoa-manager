import { useTranslation } from "react-i18next";

import { cn } from "@hoa-mngr/ui/lib/utils";

import type { AssemblyRecordResponseDto } from "@/api/generated/model";

import { getOptionLabel } from "../shared/question-options";
import { runningCountFigure } from "./running-count";

/** Dot tones follow the option's meaning, matching the results page. */
const DOT: Record<string, string> = {
    YES: "bg-success",
    NO: "bg-destructive-bar",
    ABSTAIN: "bg-border",
};

const TONE: Record<string, string> = {
    YES: "text-success-tint-foreground",
    NO: "text-destructive-muted-foreground",
    ABSTAIN: "text-secondary-foreground",
};

interface RunningCountCardProps {
    questions: AssemblyRecordResponseDto["questions"];
    totals: AssemblyRecordResponseDto["totals"];
    weightBasis: AssemblyRecordResponseDto["weightBasis"];
}

export function RunningCountCard({
    questions,
    totals,
    weightBasis,
}: RunningCountCardProps) {
    const { t } = useTranslation(["voting"]);

    if (questions.length === 0) return null;

    const entered = totals.presentUnitCount - totals.unitsAwaitingEntry;

    return (
        <div className="rounded-card bg-card shadow-clay-card border p-4 px-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-faint text-[11px] font-semibold tracking-wide uppercase">
                    {t("voting:assemblyRecord.tally.eyebrow")}
                </p>
                <p className="text-muted-foreground text-[12.5px]">
                    {t("voting:assemblyRecord.tally.entered", {
                        entered,
                        present: totals.presentUnitCount,
                    })}
                </p>
            </div>

            <ol className="mt-3 space-y-3">
                {questions.map((question, index) => (
                    <li key={question.questionId}>
                        <p className="truncate text-[13.5px] font-semibold">
                            <span className="text-faint mr-1.5">
                                {index + 1}
                            </span>
                            {question.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                            {question.options.map((option) => (
                                <span
                                    key={option.optionId}
                                    className="bg-accent inline-flex items-baseline gap-1.5 rounded-full px-2.5 py-1 text-[12.5px]"
                                >
                                    <span
                                        className={cn(
                                            "h-1.5 w-1.5 self-center rounded-full",
                                            DOT[option.optionKey] ??
                                                "bg-border",
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            "font-semibold",
                                            TONE[option.optionKey],
                                        )}
                                    >
                                        {runningCountFigure(
                                            option,
                                            totals.allVotesWeight,
                                            weightBasis,
                                            t,
                                        )}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {getOptionLabel(
                                            option.optionKey,
                                            option.label,
                                            t,
                                        )}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </li>
                ))}
            </ol>

            <p className="text-faint mt-3 text-[11.5px]">
                {t(
                    weightBasis === "UNIT_SHARE"
                        ? "voting:assemblyRecord.tally.footnoteShare"
                        : "voting:assemblyRecord.tally.footnoteUnits",
                )}
            </p>
        </div>
    );
}
