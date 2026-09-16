import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import {
    formatFraction,
    formatPercent,
    reduceFraction,
    StatusChip,
    type StatusChipVariant,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type {
    AssemblyRecordPreviewDto,
    AssemblyRecordQuestionDto,
} from "@/api/generated/model";
import { sharePercent } from "@/features/units/utils/shares";

import { getOptionLabel } from "../shared/question-options";

const ZERO = { num: "0", den: "1" };

const CHIP: Record<string, StatusChipVariant> = {
    APPROVED: "success",
    REJECTED: "destructive",
    WINNER: "primary",
    NOT_DECIDED: "warning",
};

/** Same tones the results page uses, so the preview reads as a rehearsal. */
const TONE: Record<string, string> = {
    YES: "bg-success",
    NO: "bg-destructive-bar",
    ABSTAIN: "bg-faint",
};

interface OutcomeCardProps {
    index: number;
    question: AssemblyRecordQuestionDto;
    quorate: boolean;
}

function outcomeLabel(
    preview: AssemblyRecordPreviewDto,
    winningLabel: string,
    t: TFunction<"voting">,
): string {
    switch (preview.outcome) {
        case "APPROVED":
            return t("outcomes.APPROVED");
        case "REJECTED":
            return t("outcomes.REJECTED");
        case "WINNER":
            return t("outcomes.winner", { option: winningLabel });
        default:
            return t("outcomes.NOT_DECIDED");
    }
}

/**
 * What publishing would write for one resolution.
 *
 * Every figure comes from the server's preview, which is the same
 * `computeVoteResults` the publish path runs. The board is being asked to
 * commit to this, so the screen does no arithmetic of its own on the verdict —
 * it only turns the percentages into widths. Those percentages are each option
 * against `majorityDenominator`, the figure the threshold is compared against.
 */
export function OutcomeCard({ index, question, quorate }: OutcomeCardProps) {
    const { t } = useTranslation(["voting"]);
    const preview = question.preview;
    if (!preview) return null;

    const denominator = sharePercent(
        Number(preview.majorityDenominator.num),
        Number(preview.majorityDenominator.den),
    );
    const percentOf = (weight: { num: string; den: string }) =>
        denominator === 0
            ? 0
            : (sharePercent(Number(weight.num), Number(weight.den)) /
                  denominator) *
              100;

    const threshold = `${t(
        `create.thresholdPicker.comparator.${preview.majorityComparator}`,
    )} ${formatFraction(reduceFraction(preview.majorityThreshold))}`;

    const winning = question.options.find(
        (o) => o.optionId === preview.winningOptionId,
    );
    const winningLabel = getOptionLabel(
        winning?.optionKey ?? "",
        winning?.label ?? "",
        t,
    );
    const yes = question.options.find((o) => o.optionKey === "YES");

    let reason: string;
    if (preview.outcome === "APPROVED" || preview.outcome === "REJECTED") {
        reason = t(
            preview.outcome === "APPROVED"
                ? "voting:assemblyRecord.review.reasonApproved"
                : "voting:assemblyRecord.review.reasonRejected",
            {
                percent: formatPercent(percentOf(yes?.weight ?? ZERO), 1),
                threshold,
            },
        );
    } else if (preview.outcome === "WINNER") {
        reason = t("voting:assemblyRecord.review.reasonWinner", {
            option: winningLabel,
            percent: formatPercent(percentOf(winning?.weight ?? ZERO), 1),
        });
    } else {
        reason = t(
            quorate
                ? "voting:assemblyRecord.review.reasonNoMajority"
                : "voting:assemblyRecord.review.reasonNoQuorum",
        );
    }

    return (
        <div
            className={cn(
                "rounded-card bg-card shadow-clay-card border p-4 px-5",
                !quorate && "border-warning-tint-border",
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-faint text-[11px] font-semibold tracking-wide uppercase">
                        {t("voting:assemblyRecord.review.resolution", {
                            index,
                        })}
                    </p>
                    <h2 className="font-display mt-0.5 text-[16.5px] leading-[22px] font-extrabold tracking-tight">
                        {question.title}
                    </h2>
                </div>
                <StatusChip
                    variant={CHIP[preview.outcome] ?? "warning"}
                    className="shrink-0"
                >
                    {outcomeLabel(preview, winningLabel, t)}
                </StatusChip>
            </div>

            <p className="text-secondary-foreground mt-2 text-[13px] leading-[19px]">
                {reason}
            </p>

            {/* Dimmed when nothing can be adopted: the bars still say how the
                room voted, but they decided nothing. */}
            <div
                className={cn(
                    "bg-muted mt-3 flex h-3 overflow-hidden rounded-full",
                    !quorate && "opacity-45",
                )}
            >
                {question.options.map((option) => (
                    <div
                        key={option.optionId}
                        className={cn(
                            "h-full",
                            TONE[option.optionKey] ?? "bg-primary",
                        )}
                        style={{ width: `${percentOf(option.weight)}%` }}
                    />
                ))}
            </div>

            <div className="text-secondary-foreground mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px]">
                {question.options.map((option) => (
                    <span
                        key={option.optionId}
                        className="inline-flex items-center gap-1.5"
                    >
                        <span
                            className={cn(
                                "h-2 w-2 rounded-[2px]",
                                TONE[option.optionKey] ?? "bg-primary",
                            )}
                        />
                        {getOptionLabel(option.optionKey, option.label, t)}{" "}
                        {formatPercent(percentOf(option.weight), 1)} ·{" "}
                        {t("results.unitCount", { count: option.unitCount })}
                    </span>
                ))}
            </div>
        </div>
    );
}
