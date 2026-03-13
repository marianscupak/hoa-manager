import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { useVotesControllerGetVoteDetail } from "@/api/generated/votes/votes";

import { StatusBadge } from "../components/status-badge";
import { VoteDetailTimeline } from "../components/vote-detail-timeline";
import { VoteDocuments } from "../components/vote-documents";
import { VoteQuestionsList } from "../components/vote-questions-list";
import { VoterStatusSidebar } from "../components/voter-status-sidebar";

export function VoteDetailPage() {
    const { t } = useTranslation(["voting"]);
    const { id } = useParams<{ id: string }>();

    const voteQuery = useVotesControllerGetVoteDetail(id ?? "", {
        query: {
            enabled: !!id,
        },
    });

    if (voteQuery.isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (voteQuery.isError || !voteQuery.data) {
        return (
            <div className="text-destructive p-8 text-center">
                {t("voting:list.error")}
            </div>
        );
    }

    const vote = voteQuery.data;

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <h1 className="text-3xl font-bold">{vote.title}</h1>
                <StatusBadge status={vote.status} />
            </div>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <VoteDetailTimeline
                        scheduledFrom={vote.scheduledFrom ?? null}
                        scheduledTo={vote.scheduledTo ?? null}
                    />

                    {vote.description && (
                        <div className="mb-10">
                            <h2 className="mb-4 text-xl font-bold">
                                {t("voting:detail.description.title")}
                            </h2>
                            <div className="leading-relaxed whitespace-pre-wrap text-slate-600">
                                {vote.description}
                            </div>
                        </div>
                    )}

                    <VoteDocuments />

                    <VoteQuestionsList questions={vote.questions} />
                </div>

                <div>
                    <VoterStatusSidebar />
                </div>
            </div>
        </div>
    );
}
