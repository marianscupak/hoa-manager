import { format } from "date-fns";
import { ArrowRight, Calendar, CheckCircle2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { type VoteListItemResponseDto } from "@/api/generated/model";

import { StatusBadge } from "./status-badge";

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
                        {vote.scheduledFrom && (
                            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    {isVotingOpen
                                        ? t("voting:list.card.endsOn")
                                        : t("voting:list.card.startsOn")}
                                    {format(
                                        new Date(vote.scheduledFrom),
                                        "d. M. yyyy HH:mm",
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                    <CardTitle className="mb-2 text-xl">{vote.title}</CardTitle>
                    <CardDescription className="leading-relaxed text-slate-500">
                        {vote.description ||
                            t("voting:list.card.noDescription")}
                    </CardDescription>
                </CardContent>

                <div className="flex flex-col items-center justify-center border-t border-slate-100 bg-slate-50/50 p-6 md:w-72 md:border-t-0 md:border-l">
                    {isVotingOpen ? (
                        <>
                            <div className="mb-4 flex flex-col items-center text-center">
                                <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
                                <span className="font-semibold text-emerald-700">
                                    {t("voting:list.card.canVote")}
                                </span>
                                <span className="text-sm text-emerald-600">
                                    {t("voting:list.card.voteRequired")}
                                </span>
                            </div>
                            <Button className="w-full cursor-pointer bg-blue-600 text-white hover:bg-blue-700">
                                {t("voting:list.card.voteAction")}{" "}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </>
                    ) : isScheduled ? (
                        <>
                            <div className="mb-4 flex flex-col items-center text-center">
                                <Users className="mb-2 h-8 w-8 text-orange-500" />
                                <span className="font-semibold text-orange-800">
                                    {t("voting:list.card.delegationNeeded")}
                                </span>
                                <span className="text-sm text-orange-600">
                                    {t("voting:list.card.fromCoOwners")}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-slate-200"
                            >
                                {t("voting:list.card.manageDelegation")}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="mb-4 flex flex-col items-center text-center">
                                <span className="font-semibold text-slate-700">
                                    {t("voting:list.card.completed")}
                                </span>
                                <span className="text-sm text-slate-500">
                                    {t("voting:list.card.viewOutcomes")}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-slate-200"
                            >
                                {t("voting:list.card.viewResults")}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
}
