import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Card, CardContent, CardDescription, CardTitle } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { VoteListItemResponseDto } from "@/api/generated/model";

import { StatusBadge } from "./status-badge";
import { VoteStatusSection } from "./vote-status-section";

interface VoteCardProps {
    vote: VoteListItemResponseDto;
}

export function VoteCard({ vote }: VoteCardProps) {
    const { t } = useTranslation(["voting"]);

    const isVotingOpen = vote.status === "OPEN";
    const isScheduled = vote.status === "SCHEDULED";

    const borderColor = isVotingOpen
        ? "border-l-emerald-500"
        : isScheduled
          ? "border-l-blue-500"
          : "border-l-slate-300";

    return (
        <Card
            className={cn(
                "overflow-hidden rounded-lg border-l-4 shadow-sm",
                borderColor,
            )}
        >
            <div className="flex flex-col md:flex-row">
                <CardContent className="flex-1 p-6">
                    <div className="mb-4 flex items-center gap-4">
                        <StatusBadge status={vote.status} />
                        {(vote.scheduledFrom || vote.scheduledTo) && (
                            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    {isVotingOpen
                                        ? t("list.card.endsOn")
                                        : vote.status === "CLOSED"
                                          ? t("list.card.endedOn")
                                          : t("list.card.startsOn")}
                                    {format(
                                        new Date(
                                            (isVotingOpen ||
                                                vote.status === "CLOSED") &&
                                            vote.scheduledTo
                                                ? vote.scheduledTo
                                                : vote.scheduledFrom!,
                                        ),
                                        "d. M. yyyy HH:mm",
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                    <Link
                        to={
                            vote.status === "CLOSED"
                                ? `/voting/${vote.id}/results`
                                : `/voting/${vote.id}`
                        }
                    >
                        <CardTitle className="mb-2 cursor-pointer text-xl hover:underline">
                            {vote.title}
                        </CardTitle>
                    </Link>
                    <CardDescription className="leading-relaxed text-slate-500">
                        {vote.description || t("list.card.noDescription")}
                    </CardDescription>
                </CardContent>

                <div className="flex flex-col items-center justify-center border-t border-slate-100 bg-slate-50/50 p-6 md:w-72 md:border-t-0 md:border-l">
                    <VoteStatusSection vote={vote} />
                </div>
            </div>
        </Card>
    );
}
