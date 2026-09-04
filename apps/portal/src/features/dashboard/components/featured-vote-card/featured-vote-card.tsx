import { formatDistanceToNow } from "date-fns";
import { cs, enUS } from "date-fns/locale";
import { useAtomValue } from "jotai";
import { Vote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
    Button,
    EmptyState,
    ErrorState,
    Skeleton,
    StatusChip,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import {
    useVotesControllerGetVoteTurnout,
    useVotesControllerGetVotes,
    useVotesControllerGetVoterStatus,
} from "@/api/generated/votes/votes";
import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard, isAdminView } from "@/auth/role-checks";

import { PersonalContextLine } from "./personal-context-line";

function pickFeaturedVote<T extends { scheduledTo?: string | null }>(
    votes: T[] | undefined,
): T | undefined {
    if (!votes || votes.length === 0) return undefined;
    // Earliest scheduledTo first. Items with no scheduledTo sink to the end.
    const sorted = [...votes].sort((a, b) => {
        const aTo = a.scheduledTo
            ? new Date(a.scheduledTo).getTime()
            : Number.POSITIVE_INFINITY;
        const bTo = b.scheduledTo
            ? new Date(b.scheduledTo).getTime()
            : Number.POSITIVE_INFINITY;
        return aTo - bTo;
    });
    return sorted[0];
}

const HERO_SHELL =
    "rounded-card-lg border-primary-tint-border shadow-clay-hero from-hero-tint flex flex-col gap-4 border bg-gradient-to-b to-white p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6";
const SLOT_MIN_H = "min-h-[104px]";

export function FeaturedVoteCard() {
    const { t, i18n } = useTranslation(["dashboard", "common"]);
    const tenantCtx = useAtomValue(tenantContextAtom);
    const adminView = isAdminView(tenantCtx?.roles);
    const canSeeTurnout = isAdminOrBoard(tenantCtx?.roles);
    const locale = i18n.language === "cs" ? cs : enUS;

    const votesQuery = useVotesControllerGetVotes(
        { status: ["OPEN", "SCHEDULED"] },
        {
            query: {
                select: (data) => pickFeaturedVote(data),
                staleTime: 0,
                refetchOnMount: "always",
            },
        },
    );

    const featuredVote = votesQuery.data;

    const voterStatusQuery = useVotesControllerGetVoterStatus(
        featuredVote?.id ?? "",
        {
            query: {
                enabled:
                    Boolean(featuredVote?.id) &&
                    !adminView &&
                    featuredVote?.status === "OPEN",
            },
        },
    );

    const turnoutQuery = useVotesControllerGetVoteTurnout(
        featuredVote?.id ?? "",
        {
            query: {
                enabled:
                    Boolean(featuredVote?.id) &&
                    canSeeTurnout &&
                    featuredVote?.status === "OPEN",
            },
        },
    );

    if (votesQuery.isLoading) {
        return (
            <div className={cn(HERO_SHELL, SLOT_MIN_H)}>
                <Skeleton className="rounded-panel h-11 w-11 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3 rounded" />
                    <Skeleton className="h-4 w-1/4 rounded" />
                </div>
            </div>
        );
    }

    if (votesQuery.isError) {
        return (
            <ErrorState
                className={SLOT_MIN_H}
                message={t("featuredVote.errorMessage")}
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => votesQuery.refetch()}
                    >
                        {t("common:retry")}
                    </Button>
                }
            />
        );
    }

    if (!featuredVote) {
        return (
            <EmptyState
                className={cn(
                    SLOT_MIN_H,
                    "flex flex-col items-center justify-center py-6",
                )}
                message={t("featuredVote.emptyTitle")}
            />
        );
    }

    const isOpen = featuredVote.status === "OPEN";
    const isScheduled = featuredVote.status === "SCHEDULED";

    // For OPEN: show "Closes in …". For SCHEDULED: show "Starts in …, closes …".
    let timing: string | null = null;
    if (featuredVote.scheduledTo) {
        const closesIn = formatDistanceToNow(
            new Date(featuredVote.scheduledTo),
            {
                addSuffix: true,
                locale,
            },
        );
        if (isScheduled && featuredVote.scheduledFrom) {
            const startsIn = formatDistanceToNow(
                new Date(featuredVote.scheduledFrom),
                { addSuffix: true, locale },
            );
            timing = t("featuredVote.startsAndCloses", {
                startWhen: startsIn,
                closeWhen: closesIn,
            });
        } else {
            timing = t("featuredVote.closesIn", { when: closesIn });
        }
    } else if (isScheduled && featuredVote.scheduledFrom) {
        const startsIn = formatDistanceToNow(
            new Date(featuredVote.scheduledFrom),
            { addSuffix: true, locale },
        );
        timing = t("featuredVote.startsAndCloses", {
            startWhen: startsIn,
            closeWhen: "—",
        });
    }

    const hasUncastBallot = (voterStatusQuery.data?.owningUnits ?? []).some(
        (u) =>
            u.status === "READY" ||
            u.status === "PROXY" ||
            u.status === "REQUIRES_DELEGATION",
    );
    const showCastCta = !adminView && isOpen && hasUncastBallot;
    const ctaLabel = showCastCta
        ? t("featuredVote.ctaCast")
        : t("featuredVote.ctaOpen");
    // Always link to the vote detail page; the detail page handles cast /
    // delegate flows correctly given the viewer's eligibility.
    const ctaTarget = `/voting/${featuredVote.id}`;

    const showTurnoutLine =
        canSeeTurnout && isOpen && Boolean(turnoutQuery.data);

    return (
        <div className={cn(HERO_SHELL, SLOT_MIN_H)}>
            <div className="bg-primary-tint text-primary shadow-clay-inset-lg rounded-panel flex h-11 w-11 shrink-0 items-center justify-center">
                <Vote className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="font-display text-title leading-6 font-extrabold tracking-tight">
                        {featuredVote.title}
                    </h2>
                    {timing && (
                        <StatusChip variant="warning">{timing}</StatusChip>
                    )}
                </div>
                {showTurnoutLine && turnoutQuery.data && (
                    <p className="text-secondary-foreground mt-1 text-sm">
                        {t("featuredVote.turnoutLine", {
                            voted: turnoutQuery.data.participationUnitCount,
                            total: turnoutQuery.data.totalVotesUnitCount,
                        })}
                    </p>
                )}
                {!adminView && voterStatusQuery.data && isOpen && (
                    <PersonalContextLine voterStatus={voterStatusQuery.data} />
                )}
            </div>
            <Button asChild className="shrink-0 self-start sm:self-center">
                <Link to={ctaTarget}>{ctaLabel}</Link>
            </Button>
        </div>
    );
}
