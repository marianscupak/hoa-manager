import { useParams } from "react-router";
import { Loader2 } from "lucide-react";

import { useVotesControllerGetVoteDetail } from "@/api/generated/votes/votes";

export function VoteDetailPage() {
    const { id } = useParams<{ id: string }>();

    const voteQuery = useVotesControllerGetVoteDetail(id ?? "", {
        query: {
            enabled: !!id,
        },
    });

    if (voteQuery.isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (voteQuery.isError || !voteQuery.data) {
        return (
            <div className="p-8 text-center text-destructive">
                Failed to load vote details.
            </div>
        );
    }

    const vote = voteQuery.data;

    return (
        <div className="container mx-auto py-8">
            <h1 className="mb-6 text-3xl font-bold">{vote.title}</h1>

            <div className="rounded-lg border bg-slate-950 p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-sm font-medium text-slate-400">
                        Debug: Full Vote Data
                    </span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                        JSON
                    </span>
                </div>
                <pre className="overflow-x-auto text-sm text-slate-200">
                    {JSON.stringify(vote, null, 2)}
                </pre>
            </div>
        </div>
    );
}
