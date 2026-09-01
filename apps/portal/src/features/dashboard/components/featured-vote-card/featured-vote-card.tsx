import { formatDistanceToNow } from "date-fns";
import { cs, enUS } from "date-fns/locale";
import { useAtomValue } from "jotai";
import { Vote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Badge, Button, Card, CardContent } from "@hoa-mngr/ui";

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
        return <SkeletonCard />;
    }

    if (votesQuery.isError) {
        return (
            <Card>
                <CardContent className="flex flex-col items-start gap-2 p-4">
                    <p className="text-destructive text-sm">
                        {t("featuredVote.errorMessage")}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => votesQuery.refetch()}
                    >
                        {t("common:retry")}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!featuredVote) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground text-sm">
                        {t("featuredVote.emptyTitle")}
                    </p>
                </CardContent>
            </Card>
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
        (u) => u.status === "READY" || u.status === "REQUIRES_DELEGATION",
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
        <div className="rounded-card-lg border-primary-tint-border shadow-clay-hero from-hero-tint flex flex-col gap-4 border bg-gradient-to-b to-white p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
            <div className="bg-primary-tint text-primary shadow-clay-inset-lg rounded-panel flex h-11 w-11 shrink-0 items-center justify-center">
                <Vote className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="font-display text-title leading-6 font-extrabold tracking-tight">
                        {featuredVote.title}
                    </h2>
                    {timing && <Badge variant="warningTint">{timing}</Badge>}
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

function SkeletonCard() {
    return (
        <Card>
            <CardContent className="h-24 animate-pulse p-4">
                <div className="bg-muted h-4 w-1/3 rounded" />
                <div className="bg-muted mt-2 h-3 w-1/4 rounded" />
            </CardContent>
        </Card>
    );
}
