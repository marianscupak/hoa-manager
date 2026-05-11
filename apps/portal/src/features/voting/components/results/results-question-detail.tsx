import { useTranslation } from "react-i18next";

import {
    VoteOptionResponseDtoOptionKey,
    VoteQuestionResponseDtoType,
    type VoteResultsResponseDto,
} from "@/api/generated/model";

type QuestionResult = VoteResultsResponseDto["questionResults"][number];

function useOptionDisplayLabel(optionKey: string, fallback: string): string {
    const { t } = useTranslation(["voting"]);
    if (optionKey === VoteOptionResponseDtoOptionKey.YES)
        return t("create.optionLabels.YES");
    if (optionKey === VoteOptionResponseDtoOptionKey.NO)
        return t("create.optionLabels.NO");
    if (optionKey === VoteOptionResponseDtoOptionKey.ABSTAIN)
        return t("create.optionLabels.ABSTAIN");
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
    const { t } = useTranslation(["voting"]);
    const displayLabel = useOptionDisplayLabel(optionKey, label);

    const pct =
        majorityDenominator > 0 ? (voteWeight / majorityDenominator) * 100 : 0;

    const isAbstain = optionKey === VoteOptionResponseDtoOptionKey.ABSTAIN;
    const isAgainst = optionKey === VoteOptionResponseDtoOptionKey.NO;

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
                {t("voting:results.unitCount", { count: voteUnitCount })} ·{" "}
                {(voteWeight * 100).toFixed(1)} %{" "}
                {t("voting:results.weightLabel")}
            </p>
        </div>
    );
}

interface ResultsQuestionDetailProps {
    question: QuestionResult & { title: string; type?: string };
    optionLabels: Record<string, { label: string; optionKey: string }>;
    quorumMet: boolean;
}

export function ResultsQuestionDetail({
    question,
    optionLabels,
    quorumMet,
}: ResultsQuestionDetailProps) {
    const { t } = useTranslation(["voting"]);

    let isApproved = false;
    const isQuorumInvalid = !quorumMet;

    if (quorumMet && question.majorityMet) {
        if (question.type === VoteQuestionResponseDtoType.YES_NO) {
            const winningMeta = question.winningOptionId
                ? optionLabels[question.winningOptionId]
                : null;
            isApproved =
                winningMeta?.optionKey === VoteOptionResponseDtoOptionKey.YES;
        } else {
            isApproved = true;
        }
    }

    return (
        <div>
            <div className="text-primary mb-1 text-xs font-semibold tracking-wider uppercase">
                {t("voting:results.finalResolution")}
            </div>
            <h2 className="mb-6 text-4xl font-black tracking-tight text-slate-900">
                {isQuorumInvalid
                    ? t("voting:results.invalid").toUpperCase()
                    : isApproved
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
