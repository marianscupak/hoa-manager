import { format } from "date-fns";
import {
    ArrowRight,
    Calendar,
    CheckCircle2,
    Pencil,
    Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { VoteListItemResponseDto } from "@/api/generated/model";

import { StatusBadge } from "./status-badge";

interface VoteCardProps {
    vote: VoteListItemResponseDto;
}

export function VoteCard({ vote }: VoteCardProps) {
    const { t } = useTranslation(["voting"]);

    const isVotingOpen = vote.status === "OPEN";
    const isScheduled = vote.status === "SCHEDULED";
    const isDraft = vote.status === "DRAFT";

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
                                        ? t("list.card.endsOn")
                                        : t("list.card.startsOn")}
                                    {format(
                                        new Date(vote.scheduledFrom),
                                        "d. M. yyyy HH:mm",
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                    <Link to={`/voting/${vote.id}`}>
                        <CardTitle className="mb-2 cursor-pointer text-xl hover:underline">
                            {vote.title}
                        </CardTitle>
                    </Link>
                    <CardDescription className="leading-relaxed text-slate-500">
                        {vote.description || t("list.card.noDescription")}
                    </CardDescription>
                </CardContent>

                <div className="flex flex-col items-center justify-center border-t border-slate-100 bg-slate-50/50 p-6 md:w-72 md:border-t-0 md:border-l">
                    {isVotingOpen ? (
                        <>
                            <div className="mb-4 flex flex-col items-center text-center">
                                <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
                                <span className="font-semibold text-emerald-700">
                                    {t("list.card.canVote")}
                                </span>
                                <span className="text-sm text-emerald-600">
                                    {t("list.card.voteRequired")}
                                </span>
                            </div>
                            <Button
                                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                                asChild
                            >
                                <Link to={`/voting/${vote.id}`}>
                                    {t("list.card.voteAction")}{" "}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </>
                    ) : isScheduled ? (
                        <>
                            <div className="mb-4 flex flex-col items-center text-center">
                                {vote.voterSummary?.requiresDelegation ? (
                                    <>
                                        <Users className="mb-2 h-8 w-8 text-orange-500" />
                                        <span className="font-semibold text-orange-800">
                                            {t("list.card.delegationNeeded")}
                                        </span>
                                        <span className="text-sm text-orange-600">
                                            {t("list.card.fromCoOwners")}
                                        </span>
                                    </>
                                ) : vote.voterSummary?.canVote ? (
                                    <>
                                        <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
                                        <span className="font-semibold text-emerald-700">
                                            {t("list.card.readyToVote")}
                                        </span>
                                        <span className="text-sm text-emerald-600">
                                            {t("list.card.readyToVoteSubtitle")}
                                        </span>
                                    </>
                                ) : vote.voterSummary?.isDelegated ? (
                                    <>
                                        <Users className="mb-2 h-8 w-8 text-slate-500" />
                                        <span className="font-semibold text-slate-700">
                                            {t("list.card.alreadyDelegated")}
                                        </span>
                                        <span className="text-sm text-slate-500">
                                            {t(
                                                "list.card.alreadyDelegatedSubtitle",
                                            )}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="mb-2 h-8 w-8 text-blue-500" />
                                        <span className="font-semibold text-slate-700">
                                            {t("list.card.scheduledStatus")}
                                        </span>
                                        <span className="text-sm text-slate-500">
                                            {t("list.card.scheduledSubtitle")}
                                        </span>
                                    </>
                                )}
                            </div>
                            {vote.voterSummary?.requiresDelegation ? (
                                <Button
                                    variant="outline"
                                    className="w-full border-slate-200"
                                    asChild
                                >
                                    <Link to={`/voting/${vote.id}/delegate`}>
                                        {t("list.card.manageDelegation")}
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full border-slate-200"
                                    asChild
                                >
                                    <Link to={`/voting/${vote.id}`}>
                                        {t("list.card.viewDetails")}
                                    </Link>
                                </Button>
                            )}
                        </>
                    ) : isDraft ? (
                        <>
                            <div className="mb-4 flex flex-col items-center text-center">
                                <Pencil className="mb-2 h-8 w-8 text-slate-500" />
                                <span className="font-semibold text-slate-700">
                                    {t("list.card.draftStatus")}
                                </span>
                                <span className="text-sm text-slate-500">
                                    {t("list.card.editDraft")}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full"
                                asChild
                            >
                                <Link to={`/voting/${vote.id}/edit`}>
                                    {t("list.card.editAction")}
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="mb-4 flex flex-col items-center text-center">
                                <span className="font-semibold text-slate-700">
                                    {t("list.card.completed")}
                                </span>
                                <span className="text-sm text-slate-500">
                                    {t("list.card.viewOutcomes")}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-slate-200"
                            >
                                {t("list.card.viewResults")}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
}
