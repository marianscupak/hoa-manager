import { format } from "date-fns";
import type { TFunction } from "i18next";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Badge, BadgeProps, Button, Card, EmptyState } from "@hoa-mngr/ui";

import {
    QuestionOutcomeDto,
    QuestionOutcomeDtoOutcome,
    VoteListItemResponseDto,
} from "@/api/generated/model";
import { useVotesControllerGetVotes } from "@/api/generated/votes/votes";

import { StatusBadge } from "../status-badge";

function outcomeVariant(
    outcome: QuestionOutcomeDtoOutcome,
): BadgeProps["variant"] {
    switch (outcome) {
        case "APPROVED":
            return "successTint";
        case "REJECTED":
            return "destructiveTint";
        case "WINNER":
            return "primaryTint";
        case "NOT_DECIDED":
        default:
            return "warningTint";
    }
}

function outcomeLabel(
    outcome: QuestionOutcomeDto,
    t: TFunction<"voting">,
): string {
    switch (outcome.outcome) {
        case "APPROVED":
            return t("outcomes.APPROVED");
        case "REJECTED":
            return t("outcomes.REJECTED");
        case "WINNER":
            return t("outcomes.winner", {
                option: outcome.winningOptionLabel ?? "",
            });
        case "NOT_DECIDED":
        default:
            return t("outcomes.NOT_DECIDED");
    }
}

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

    if (!closedVotes || closedVotes.length === 0) {
        return <EmptyState message={t("resultsOverview.empty")} />;
    }

    return (
        <div className="flex flex-col gap-3">
            {closedVotes.map((vote) => (
                <ResultRow key={vote.id} vote={vote} t={t} />
            ))}
        </div>
    );
}

interface ResultRowProps {
    vote: VoteListItemResponseDto;
    t: TFunction<"voting">;
}

function ResultRow({ vote, t }: ResultRowProps) {
    return (
        <Card className="flex items-center gap-5 px-[22px] py-[18px]">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                    <StatusBadge status={vote.status} />
                    <Link
                        to={`/voting/${vote.id}/results`}
                        className="font-display hover:text-primary-hover text-title font-extrabold tracking-tight"
                    >
                        {vote.title}
                    </Link>
                </div>
                {vote.scheduledTo && (
                    <p className="text-secondary-foreground mt-1.5 text-sm leading-5">
                        {t("list.card.endedOn")}
                        {format(new Date(vote.scheduledTo), "d. M. yyyy HH:mm")}
                    </p>
                )}
                {vote.questionOutcomes && vote.questionOutcomes.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {vote.questionOutcomes.map((outcome) => (
                            <Badge
                                key={outcome.questionId}
                                variant={outcomeVariant(outcome.outcome)}
                                title={outcome.title}
                            >
                                {outcomeLabel(outcome, t)}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
            <Button variant="outline" className="shrink-0" asChild>
                <Link to={`/voting/${vote.id}/results`}>
                    {t("list.card.viewResults")}
                </Link>
            </Button>
        </Card>
    );
}
