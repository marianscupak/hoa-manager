import { useAtomValue } from "jotai";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@hoa-mngr/ui";

import { VoteListItemResponseDto } from "@/api/generated/model";
import { useVotesControllerGetVotes } from "@/api/generated/votes/votes";
import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";

import { VoteCard } from "../vote-card";

function needsAction(vote: VoteListItemResponseDto): boolean {
    return (
        (vote.status === "OPEN" &&
            Boolean(vote.voterSummary?.canVote) &&
            !vote.voterSummary?.hasVoted) ||
        (vote.status === "SCHEDULED" &&
            Boolean(vote.voterSummary?.requiresDelegation))
    );
}

export function VotingActiveTab() {
    const { t } = useTranslation(["voting"]);
    const tenantCtx = useAtomValue(tenantContextAtom);
    const adminOrBoard = isAdminOrBoard(tenantCtx?.roles);
    const { data: votes, isLoading, error } = useVotesControllerGetVotes();

    const { needsActionVotes, upcomingVotes, draftVotes } = useMemo(() => {
        const all = votes ?? [];
        const needsActionVotes = all.filter(needsAction);
        const upcomingVotes = all.filter(
            (v) =>
                (v.status === "OPEN" || v.status === "SCHEDULED") &&
                !needsAction(v),
        );
        const draftVotes = adminOrBoard
            ? all.filter((v) => v.status === "DRAFT")
            : [];
        return { needsActionVotes, upcomingVotes, draftVotes };
    }, [votes, adminOrBoard]);

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

    const isEmpty =
        needsActionVotes.length === 0 &&
        upcomingVotes.length === 0 &&
        draftVotes.length === 0;

    if (isEmpty) {
        return <EmptyState message={t("list.empty.all")} />;
    }

    return (
        <div className="flex flex-col gap-7">
            {needsActionVotes.length > 0 && (
                <VoteGroup
                    label={t("hub.groups.needsAction")}
                    votes={needsActionVotes}
                />
            )}
            {upcomingVotes.length > 0 && (
                <VoteGroup
                    label={t("hub.groups.upcoming")}
                    votes={upcomingVotes}
                />
            )}
            {draftVotes.length > 0 && (
                <VoteGroup label={t("hub.groups.drafts")} votes={draftVotes} />
            )}
        </div>
    );
}

interface VoteGroupProps {
    label: string;
    votes: VoteListItemResponseDto[];
}

function VoteGroup({ label, votes }: VoteGroupProps) {
    return (
        <section>
            <h2 className="text-faint mb-2.5 text-[11px] font-bold tracking-wider uppercase">
                {label}
            </h2>
            <div className="flex flex-col gap-3">
                {votes.map((vote) => (
                    <VoteCard key={vote.id} vote={vote} />
                ))}
            </div>
        </section>
    );
}
