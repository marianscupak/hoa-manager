import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { type VoteResultsResponseDto } from "@/api/generated/model";

interface ResultsQuestionCardProps {
    index: number;
    question: VoteResultsResponseDto["questionResults"][number] & {
        title: string;
    };
    isSelected: boolean;
    onClick: () => void;
    participationWeight: number;
    denominatorWeight: number;
}

export function ResultsQuestionCard({
    index,
    question,
    isSelected,
    onClick,
    participationWeight,
    denominatorWeight,
}: ResultsQuestionCardProps) {
    const { t } = useTranslation(["voting"]);

    const quorumPct =
        denominatorWeight > 0
            ? ((participationWeight / denominatorWeight) * 100).toFixed(1)
            : "0.0";

    const winningOpt = question.winningOptionId
        ? question.optionResults.find(
              (o) => o.optionId === question.winningOptionId,
          )
        : null;

    const inFavorPct =
        winningOpt && question.majorityDenominatorValue > 0
            ? (
                  (winningOpt.voteWeight / question.majorityDenominatorValue) *
                  100
              ).toFixed(1)
            : "—";

    return (
        <button
            onClick={onClick}
            className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
        >
            <div className="mb-3 flex items-start justify-between gap-2">
                {question.majorityMet ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                        <CheckCircle2 className="h-3 w-3" />
                        {t("voting:results.approved")}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-red-700 uppercase">
                        <XCircle className="h-3 w-3" />
                        {t("voting:results.rejected")}
                    </span>
                )}
                <div
                    className={`h-4 w-4 rounded-full border-2 transition-all ${
                        isSelected
                            ? "border-primary bg-primary"
                            : "border-slate-300"
                    }`}
                />
            </div>
            <p className="mb-4 text-sm font-semibold text-slate-800">
                {index + 1}. {question.title}
            </p>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="mb-0.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                        {t("voting:results.quorum")}
                    </p>
                    <p className="text-base font-bold text-slate-700">
                        {quorumPct} %
                    </p>
                </div>
                <div>
                    <p className="mb-0.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                        {t("voting:results.inFavor")}
                    </p>
                    <p
                        className={`text-base font-bold ${question.majorityMet ? "text-emerald-600" : "text-red-600"}`}
                    >
                        {inFavorPct} %
                    </p>
                </div>
            </div>
        </button>
    );
}
