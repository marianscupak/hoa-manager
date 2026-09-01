import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Button, EmptyState, ErrorState, Skeleton } from "@hoa-mngr/ui";

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
    const { t } = useTranslation(["voting", "common"]);
    const tenantCtx = useAtomValue(tenantContextAtom);
    const adminOrBoard = isAdminOrBoard(tenantCtx?.roles);
    const {
        data: votes,
        isLoading,
        error,
        refetch,
    } = useVotesControllerGetVotes();

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
            <div className="flex flex-col gap-3">
                {[0, 1].map((i) => (
                    <Skeleton
                        key={i}
                        className="rounded-card h-[110px] w-full"
                    />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <ErrorState
                message={t("list.error")}
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                    >
                        {t("common:retry")}
                    </Button>
                }
            />
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
            <h2 className="text-faint text-2xs mb-2.5 font-bold tracking-wider uppercase">
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
