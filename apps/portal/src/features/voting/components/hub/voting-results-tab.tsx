import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useVotesControllerGetVotes } from "@/api/generated/votes/votes";

import { VoteCard } from "../vote-card";

export function VotingResultsTab() {
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
        <div className="flex flex-col gap-6">
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
