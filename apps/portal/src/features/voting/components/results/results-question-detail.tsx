import { useTranslation } from "react-i18next";

import { type VoteResultsResponseDto } from "@/api/generated/model";

type QuestionResult = VoteResultsResponseDto["questionResults"][number];

function useOptionDisplayLabel(optionKey: string, fallback: string): string {
    const { t } = useTranslation(["voting"]);
    if (optionKey === "YES") return t("create.optionLabels.YES");
    if (optionKey === "NO") return t("create.optionLabels.NO");
    if (optionKey === "ABSTAIN") return t("create.optionLabels.ABSTAIN");
    return fallback;
}

interface ResultsOptionBarProps {
    optionId: string;
    label: string;
    optionKey: string;
    voteWeight: number;
    voteUnitCount: number;
    majorityDenominator: number;
    isWinner: boolean;
}

function ResultsOptionBar({
    label,
    optionKey,
    voteWeight,
    voteUnitCount,
    majorityDenominator,
    isWinner,
}: ResultsOptionBarProps) {
    const displayLabel = useOptionDisplayLabel(optionKey, label);

    const pct =
        majorityDenominator > 0 ? (voteWeight / majorityDenominator) * 100 : 0;

    const isAbstain = optionKey === "ABSTAIN";
    const isAgainst = optionKey === "NO";

    const barColor = isAbstain
        ? "bg-slate-300"
        : isAgainst
          ? "bg-rose-400"
          : isWinner
            ? "bg-primary"
            : "bg-slate-400";

    return (
        <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                    {displayLabel}
                </span>
                <span className="text-sm font-bold text-slate-800">
                    {pct.toFixed(1)}%
                </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100">
                <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                />
            </div>
            <p className="mt-1 text-xs text-slate-500">
                {voteUnitCount} units · {voteWeight.toFixed(2)} weight
            </p>
        </div>
    );
}

interface ResultsQuestionDetailProps {
    question: QuestionResult & { title: string };
    optionLabels: Record<string, { label: string; optionKey: string }>;
}

export function ResultsQuestionDetail({
    question,
    optionLabels,
}: ResultsQuestionDetailProps) {
    const { t } = useTranslation(["voting"]);

    return (
        <div>
            <div className="text-primary mb-1 text-xs font-semibold tracking-wider uppercase">
                {t("voting:results.finalResolution")}
            </div>
            <h2 className="mb-6 text-4xl font-black tracking-tight text-slate-900">
                {question.majorityMet
                    ? t("voting:results.approved").toUpperCase()
                    : t("voting:results.rejected").toUpperCase()}
            </h2>

            <div className="space-y-1">
                {question.optionResults.map((opt) => {
                    const meta = optionLabels[opt.optionId] ?? {
                        label: opt.optionId,
                        optionKey: "",
                    };
                    return (
                        <ResultsOptionBar
                            key={opt.optionId}
                            optionId={opt.optionId}
                            label={meta.label}
                            optionKey={meta.optionKey}
                            voteWeight={opt.voteWeight}
                            voteUnitCount={opt.voteUnitCount}
                            majorityDenominator={
                                question.majorityDenominatorValue
                            }
                            isWinner={opt.optionId === question.winningOptionId}
                        />
                    );
                })}
            </div>

            {question.majorityThresholdValue !== null && (
                <p className="mt-4 text-xs text-slate-500">
                    {t("voting:results.majorityThresholdNote", {
                        threshold: (
                            question.majorityThresholdValue * 100
                        ).toFixed(1),
                    })}
                </p>
            )}
        </div>
    );
}
