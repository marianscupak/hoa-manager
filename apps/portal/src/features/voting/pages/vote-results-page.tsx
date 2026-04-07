import { Calendar, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import {
    type VoteDetailResponseDto,
    type VoteResultsResponseDto,
} from "@/api/generated/model";
import {
    useVotesControllerGetVoteDetail,
    useVotesControllerGetVoteResults,
} from "@/api/generated/votes/votes";

import { ResultsQuestionCard } from "../components/results/results-question-card";
import { ResultsQuestionDetail } from "../components/results/results-question-detail";
import { ResultsQuorumPanel } from "../components/results/results-quorum-panel";
import { StatusBadge } from "../components/status-badge";

type EnrichedQuestion = VoteResultsResponseDto["questionResults"][number] & {
    title: string;
};

function buildOptionLabelMap(
    vote: VoteDetailResponseDto,
): Record<string, { label: string; optionKey: string }> {
    const map: Record<string, { label: string; optionKey: string }> = {};
    for (const q of vote.questions) {
        for (const opt of q.options) {
            map[opt.id] = { label: opt.label, optionKey: opt.optionKey };
        }
    }
    return map;
}

function buildEnrichedQuestions(
    vote: VoteDetailResponseDto,
    results: VoteResultsResponseDto,
): EnrichedQuestion[] {
    return results.questionResults.map((qr) => {
        const question = vote.questions.find((q) => q.id === qr.questionId);
        return {
            ...qr,
            title: question?.title ?? qr.questionId,
        };
    });
}

export function VoteResultsPage() {
    const { t } = useTranslation(["voting"]);
    const { id } = useParams<{ id: string }>();

    const [selectedIndex, setSelectedIndex] = useState(0);

    const detailQuery = useVotesControllerGetVoteDetail(id ?? "", {
        query: { enabled: !!id },
    });

    const resultsQuery = useVotesControllerGetVoteResults(id ?? "", {
        query: { enabled: !!id },
    });

    const isLoading = detailQuery.isLoading || resultsQuery.isLoading;
    const isError =
        detailQuery.isError ||
        resultsQuery.isError ||
        !detailQuery.data ||
        !resultsQuery.data;

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-destructive p-8 text-center">
                {t("voting:list.error")}
            </div>
        );
    }

    const vote = detailQuery.data;
    const results = resultsQuery.data;

    const enrichedQuestions = buildEnrichedQuestions(vote, results);
    const optionLabelMap = buildOptionLabelMap(vote);
    const selectedQuestion = enrichedQuestions[selectedIndex];

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        {vote.title} — {t("voting:results.pageTitle")}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <StatusBadge status={vote.status} />
                        {results.computedAt && (
                            <span className="flex items-center gap-1.5 text-sm text-slate-500">
                                <Calendar className="h-3.5 w-3.5" />
                                {t("voting:results.finalizedAt")}:{" "}
                                {new Date(results.computedAt).toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {enrichedQuestions.length > 0 && (
                <div
                    className={`mb-8 grid gap-4 ${
                        enrichedQuestions.length === 1
                            ? "max-w-sm grid-cols-1"
                            : enrichedQuestions.length === 2
                              ? "grid-cols-1 sm:grid-cols-2"
                              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    }`}
                >
                    {enrichedQuestions.map((q, i) => (
                        <ResultsQuestionCard
                            key={q.questionId}
                            index={i}
                            question={q}
                            isSelected={i === selectedIndex}
                            onClick={() => setSelectedIndex(i)}
                            participationWeight={results.participationWeight}
                            denominatorWeight={results.denominatorWeight}
                        />
                    ))}
                </div>
            )}

            {selectedQuestion && (
                <>
                    <h2 className="mb-4 text-lg font-bold text-slate-700">
                        {t("voting:results.resolutionDetails", {
                            index: selectedIndex + 1,
                            title: selectedQuestion.title,
                        })}
                    </h2>

                    <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
                            <ResultsQuestionDetail
                                question={selectedQuestion}
                                optionLabels={optionLabelMap}
                            />
                        </div>
                        <div>
                            <ResultsQuorumPanel results={results} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
