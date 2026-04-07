import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { type VoteResultsResponseDto } from "@/api/generated/model";

interface ResultsQuorumPanelProps {
    results: VoteResultsResponseDto;
}

export function ResultsQuorumPanel({ results }: ResultsQuorumPanelProps) {
    const { t } = useTranslation(["voting"]);

    const participationPct =
        results.denominatorWeight > 0
            ? (
                  (results.participationWeight / results.denominatorWeight) *
                  100
              ).toFixed(1)
            : "0.0";

    return (
        <div className="rounded-xl bg-slate-900 p-6 text-white">
            <div className="mb-4 flex items-center gap-2">
                {results.quorumMet ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                )}
                <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
                    {t("voting:results.quorumValidation")}
                </span>
            </div>

            <p className="mb-2 text-5xl font-black tracking-tight">
                {participationPct}%
            </p>
            <p className="mb-6 text-sm text-slate-400">
                {results.quorumMet
                    ? t("voting:results.quorumMet")
                    : t("voting:results.quorumNotMet")}
            </p>

            <div className="space-y-3 border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                        {t("voting:results.totalEligibleUnits")}
                    </span>
                    <span className="text-lg font-bold">
                        {results.denominatorUnitCount}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                        {t("voting:results.votesCast")}
                    </span>
                    <span className="text-lg font-bold">
                        {results.participationUnitCount}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                        {t("voting:results.participationWeight")}
                    </span>
                    <span className="text-lg font-bold">
                        {results.participationWeight.toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    );
}
