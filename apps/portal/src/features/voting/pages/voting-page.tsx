import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useVotesControllerGetVotes } from "@/api/generated/votes/votes";

import { VoteCard } from "../components/vote-card";
import { VotingFilter, type FilterType } from "../components/voting-filter";

export function VotingPage() {
    const { t } = useTranslation(["voting"]);
    const { data: votes, isLoading, error } = useVotesControllerGetVotes();
    const [filter, setFilter] = useState<FilterType>("ALL");

    const filteredVotes = useMemo(() => {
        if (!votes) return [];
        if (filter === "ALL") return votes;
        return votes.filter((v) => v.status === filter);
    }, [votes, filter]);

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
                {t("voting:list.error")}
            </div>
        );
    }

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-6 p-2 md:p-6">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t("voting:list.title")}
                    </h1>
                    <p className="text-slate-500">
                        {t("voting:list.description")}
                    </p>
                </div>

                <VotingFilter filter={filter} onFilterChange={setFilter} />
            </div>

            {!filteredVotes || filteredVotes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center text-slate-500">
                    {filter === "ALL"
                        ? t("voting:list.empty.all")
                        : t("voting:list.empty.filtered", {
                              status: (filter === "OPEN"
                                  ? t("voting:list.filters.open")
                                  : filter === "SCHEDULED"
                                    ? t("voting:list.filters.scheduled")
                                    : t("voting:list.filters.closed")
                              ).toLowerCase(),
                          })}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredVotes.map((vote) => (
                        <VoteCard key={vote.id} vote={vote} />
                    ))}
                </div>
            )}
        </div>
    );
}
