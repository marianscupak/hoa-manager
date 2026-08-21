import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useVotesControllerGetVotes } from "@/api/generated/votes/votes";

import { VoteCard } from "../vote-card";
import { VotingFilter, type FilterType } from "../voting-filter";

export function VotingActiveTab() {
    const { t } = useTranslation(["voting"]);
    const { data: votes, isLoading, error } = useVotesControllerGetVotes();
    const [filter, setFilter] = useState<FilterType>("ALL");

    const filteredVotes = useMemo(() => {
        if (!votes) return [];
        if (filter === "ALL") return votes.filter((v) => v.status !== "CLOSED");
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
                {t("list.error")}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-end gap-4">
                <VotingFilter filter={filter} onFilterChange={setFilter} />
            </div>

            {!filteredVotes || filteredVotes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center text-slate-500">
                    {filter === "ALL"
                        ? t("list.empty.all")
                        : t("list.empty.filtered", {
                              status: t(
                                  `list.filters.${filter.toLowerCase()}` as
                                      | "list.filters.open"
                                      | "list.filters.scheduled"
                                      | "list.filters.closed",
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
