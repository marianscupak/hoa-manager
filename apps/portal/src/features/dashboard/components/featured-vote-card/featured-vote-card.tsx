import { formatDistanceToNow } from "date-fns";
import { cs, enUS } from "date-fns/locale";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button, Card, CardContent } from "@hoa-mngr/ui";

import {
    useVotesControllerGetVotes,
    useVotesControllerGetVoterStatus,
} from "@/api/generated/votes/votes";
import { tenantContextAtom } from "@/auth/atoms";
import type { Role } from "@/auth/roles";

import { PersonalContextLine } from "./personal-context-line";

const ADMIN_VIEW_ROLES: Role[] = ["ADMIN", "BOARD_MEMBER", "AUDITOR"];

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
    const isAdminView = (tenantCtx?.roles ?? []).some((r) =>
        ADMIN_VIEW_ROLES.includes(r),
    );
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
                    !isAdminView &&
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
        const closesIn = formatDistanceToNow(new Date(featuredVote.scheduledTo), {
            addSuffix: true,
            locale,
        });
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
    const showCastCta = !isAdminView && isOpen && hasUncastBallot;
    const ctaLabel = showCastCta
        ? t("featuredVote.ctaCast")
        : t("featuredVote.ctaOpen");
    // Always link to the vote detail page; the detail page handles cast /
    // delegate flows correctly given the viewer's eligibility.
    const ctaTarget = `/voting/${featuredVote.id}`;

    return (
        <Card>
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">
                            {featuredVote.title}
                        </h2>
                        <span
                            className={
                                "rounded-full px-2 py-0.5 text-xs font-medium " +
                                (isOpen
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-blue-100 text-blue-700")
                            }
                        >
                            {isOpen
                                ? t("featuredVote.open")
                                : t("featuredVote.scheduled")}
                        </span>
                    </div>
                    {timing && (
                        <p className="text-muted-foreground text-sm">{timing}</p>
                    )}
                    {!isAdminView && voterStatusQuery.data && isOpen && (
                        <PersonalContextLine
                            voterStatus={voterStatusQuery.data}
                        />
                    )}
                </div>
                <Button
                    asChild
                    className="self-start md:self-center"
                >
                    <Link to={ctaTarget}>{ctaLabel}</Link>
                </Button>
            </CardContent>
        </Card>
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
