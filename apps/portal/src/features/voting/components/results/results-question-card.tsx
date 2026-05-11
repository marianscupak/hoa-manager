import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    SetVoteRulesetResponseDtoQuorumMeasure,
    VoteOptionResponseDtoOptionKey,
    VoteQuestionResponseDtoType,
    type VoteResultsResponseDto,
} from "@/api/generated/model";

interface ResultsQuestionCardProps {
    index: number;
    question: VoteResultsResponseDto["questionResults"][number] & {
        title: string;
    };
    isSelected: boolean;
    onClick: () => void;
    participationWeight: number;
    denominatorWeight: number;
    optionLabels: Record<string, { label: string; optionKey: string }>;
    quorumMeasure: string | undefined;
    denominatorUnitCount: number;
    participationUnitCount: number;
    quorumMet: boolean;
}

export function ResultsQuestionCard({
    index,
    question,
    isSelected,
    onClick,
    participationWeight,
    denominatorWeight,
    optionLabels,
    quorumMeasure,
    denominatorUnitCount,
    participationUnitCount,
    quorumMet,
}: ResultsQuestionCardProps) {
    const { t } = useTranslation(["voting"]);

    const quorumPct =
        quorumMeasure === SetVoteRulesetResponseDtoQuorumMeasure.UNIT_COUNT
            ? denominatorUnitCount > 0
                ? (
                      (participationUnitCount / denominatorUnitCount) *
                      100
                  ).toFixed(1)
                : "0.0"
            : denominatorWeight > 0
              ? ((participationWeight / denominatorWeight) * 100).toFixed(1)
              : "0.0";

    const winningOpt = question.winningOptionId
        ? question.optionResults.find(
              (o) => o.optionId === question.winningOptionId,
          )
        : null;

    let inFavorOpt;
    if (question.type === VoteQuestionResponseDtoType.YES_NO) {
        const yesOptionId = Object.keys(optionLabels).find(
            (id) =>
                optionLabels[id].optionKey ===
                VoteOptionResponseDtoOptionKey.YES,
        );
        inFavorOpt = question.optionResults.find(
            (o) => o.optionId === yesOptionId,
        );
    } else {
        inFavorOpt = winningOpt;
    }

    const inFavorPct =
        inFavorOpt && question.majorityDenominatorValue > 0
            ? (
                  (inFavorOpt.voteWeight / question.majorityDenominatorValue) *
                  100
              ).toFixed(1)
            : "—";

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
        <button
            onClick={onClick}
            className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
        >
            <div className="mb-3 flex items-start justify-between gap-2">
                {isQuorumInvalid ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-amber-700 uppercase">
                        <XCircle className="h-3 w-3" />
                        {t("voting:results.invalidQuorum")}
                    </span>
                ) : isApproved ? (
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
                        className={`text-base font-bold ${isApproved ? "text-emerald-600" : "text-red-600"}`}
                    >
                        {inFavorPct} %
                    </p>
                </div>
            </div>
        </button>
    );
}
