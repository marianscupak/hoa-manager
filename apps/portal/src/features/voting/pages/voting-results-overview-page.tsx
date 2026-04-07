import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useVotesControllerGetVotes } from "@/api/generated/votes/votes";

import { VoteCard } from "../components/vote-card";

export function VotingResultsOverviewPage() {
    const { t } = useTranslation(["voting"]);
    const { data: votes, isLoading, error } = useVotesControllerGetVotes();

    const closedVotes = useMemo(() => {
        if (!votes) return [];
        return votes.filter((v) => v.status === "CLOSED");
    }, [votes]);

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-destructive rounded-md border p-4">
                {t("resultsOverview.error")}
            </div>
        );
    }

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-6 p-2 md:p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">
                    {t("resultsOverview.title")}
                </h1>
                <p className="text-slate-500">
                    {t("resultsOverview.description")}
                </p>
            </div>

            {!closedVotes || closedVotes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center text-slate-500">
                    {t("resultsOverview.empty")}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {closedVotes.map((vote) => (
                        <VoteCard key={vote.id} vote={vote} />
                    ))}
                </div>
            )}
        </div>
    );
}
