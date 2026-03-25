import { formatDistanceToNow, isPast } from "date-fns";
import { cs } from "date-fns/locale";
import {
    AlertTriangle,
    ArrowRight,
    ExternalLink,
    Home,
    Info,
    Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import {
    useVotesControllerGetVoteDetail,
    useVotesControllerGetVoterStatus,
} from "@/api/generated/votes/votes";

export function VoterStatusSidebar() {
    const { t, i18n } = useTranslation(["voting"]);
    const { id } = useParams<{ id: string }>();

    const voteId = id ?? "";
    const currentLocale = i18n.language === "cs" ? cs : undefined;

    const voteQuery = useVotesControllerGetVoteDetail(voteId, {
        query: {
            enabled: !!voteId,
        },
    });

    const statusQuery = useVotesControllerGetVoterStatus(voteId, {
        query: {
            enabled: !!voteId,
        },
    });

    if (voteQuery.isLoading || statusQuery.isLoading) {
        return (
            <div className="flex h-64 items-center justify-center rounded-lg border bg-white shadow-sm">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (
        voteQuery.isError ||
        statusQuery.isError ||
        !voteQuery.data ||
        !statusQuery.data
    ) {
        return (
            <div className="flex h-64 items-center justify-center rounded-lg border bg-white p-6 text-center shadow-sm">
                <p className="text-destructive text-sm">{t("list.error")}</p>
            </div>
        );
    }

    const vote = voteQuery.data!;
    const statusData = statusQuery.data;
    const isVoteOpen = vote.status === "OPEN";

    const unitRequiringDelegation = statusData.owningUnits.find(
        (u) => u.status === "REQUIRES_DELEGATION",
    );

    let timerMessage = "";
    if (vote.status === "OPEN" && vote.scheduledTo) {
        const endDate = new Date(vote.scheduledTo);
        if (!isPast(endDate)) {
            timerMessage = `${t("detail.statusSidebar.closesIn")} ${formatDistanceToNow(endDate, { locale: currentLocale, addSuffix: true })}`;
        }
    } else if (
        (vote.status === "SCHEDULED" || vote.status === "DRAFT") &&
        vote.scheduledFrom
    ) {
        const startDate = new Date(vote.scheduledFrom);
        if (!isPast(startDate)) {
            timerMessage = `${t("detail.statusSidebar.opensIn")} ${formatDistanceToNow(startDate, { locale: currentLocale, addSuffix: true })}`;
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
                <div className="flex flex-col gap-1 border-b border-slate-100 bg-slate-50/50 p-6">
                    <h3 className="text-lg font-bold">
                        {t("detail.statusSidebar.title")}
                    </h3>
                    {timerMessage && (
                        <p className="text-sm text-slate-500">{timerMessage}</p>
                    )}
                </div>

                <div className="p-6 pb-2">
                    <h4 className="mb-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        {t("voting:detail.statusSidebar.owningUnits")}
                    </h4>

                    <div className="flex flex-col gap-4">
                        {statusData.owningUnits.map((unit) => (
                            <div
                                key={unit.id}
                                className="flex items-start gap-4"
                            >
                                <div
                                    className={cn(
                                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                        unit.status === "READY" ||
                                            unit.status === "VOTED"
                                            ? "bg-emerald-100 text-emerald-600"
                                            : unit.status ===
                                                "REQUIRES_DELEGATION"
                                              ? "bg-orange-100 text-orange-600"
                                              : unit.status === "DELEGATED"
                                                ? "bg-slate-100 text-slate-600"
                                                : unit.status === "INELIGIBLE"
                                                  ? "bg-red-100 text-red-600"
                                                  : "bg-blue-100 text-blue-600",
                                    )}
                                >
                                    <Home className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h5 className="truncate font-semibold text-slate-900">
                                            {unit.name}
                                        </h5>
                                        {unit.status === "READY" ? (
                                            <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                                {t(
                                                    "voting:detail.statusSidebar.statusReady",
                                                )}
                                            </span>
                                        ) : unit.status ===
                                          "REQUIRES_DELEGATION" ? (
                                            <span className="shrink-0 rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-800">
                                                {t(
                                                    "voting:detail.statusSidebar.statusDelegation",
                                                )}
                                            </span>
                                        ) : unit.status === "DELEGATED" ? (
                                            <span className="shrink-0 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                {t(
                                                    "voting:detail.statusSidebar.statusDelegated",
                                                )}
                                            </span>
                                        ) : unit.status === "INELIGIBLE" ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="flex shrink-0 cursor-help items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                                                        {t(
                                                            "voting:detail.statusSidebar.statusIneligible",
                                                        )}
                                                        {unit.ineligibleReason && (
                                                            <Info className="h-3.5 w-3.5 opacity-70" />
                                                        )}
                                                    </span>
                                                </TooltipTrigger>
                                                {unit.ineligibleReason && (
                                                    <TooltipContent>
                                                        {t(
                                                            `voting:detail.statusSidebar.ineligibleReasons.${unit.ineligibleReason}`,
                                                        )}
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        ) : unit.status === "VOTED" ? (
                                            <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                                {t(
                                                    "voting:detail.statusSidebar.statusVoted",
                                                )}
                                            </span>
                                        ) : (
                                            <span className="shrink-0 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                {t(
                                                    "voting:detail.statusSidebar.statusDelegated",
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {t("voting:detail.statusSidebar.share")}{" "}
                                        {unit.share}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {unitRequiringDelegation && (
                        <div className="mt-4 flex gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-orange-600" />
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium text-orange-800">
                                    {t(
                                        "voting:detail.statusSidebar.delegationWarning",
                                        {
                                            unitName:
                                                unitRequiringDelegation.name,
                                        },
                                    )}
                                </p>
                                <Link
                                    to={`/voting/${voteId}/delegate`}
                                    className="text-sm font-bold text-orange-900 underline underline-offset-2 hover:no-underline"
                                >
                                    {t(
                                        "voting:detail.statusSidebar.manageDelegation",
                                    )}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto flex flex-col gap-4 border-t border-slate-100 p-6">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500">
                            {t("voting:detail.statusSidebar.totalPower")}
                        </span>
                        <span className="font-bold">
                            {statusData.totalVotingPower.value}/
                            {statusData.totalVotingPower.maximum}
                        </span>
                    </div>

                    {isVoteOpen && (
                        <>
                            <Button
                                size="lg"
                                disabled={!statusData.canVote}
                                asChild={statusData.canVote}
                                className={cn(
                                    "w-full font-semibold",
                                    statusData.canVote
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "",
                                )}
                            >
                                {statusData.canVote ? (
                                    <Link to={`/voting/${voteId}/cast`}>
                                        {t(
                                            "voting:detail.statusSidebar.voteButton",
                                        )}{" "}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                ) : (
                                    <>
                                        {statusData.owningUnits.some(
                                            (u) => u.status === "VOTED",
                                        )
                                            ? t(
                                                  "voting:detail.statusSidebar.alreadyVotedButton",
                                              )
                                            : t(
                                                  "voting:detail.statusSidebar.voteButton",
                                              )}{" "}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>

                            <p className="px-4 text-center text-xs text-slate-500">
                                {t(
                                    "voting:detail.statusSidebar.secureBoothHint",
                                )}
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Help Card */}
            <div className="flex flex-col gap-3 rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="font-bold">
                    {t("voting:detail.statusSidebar.help.title")}
                </h3>
                <p className="text-sm text-slate-500">
                    {t("voting:detail.statusSidebar.help.description")}
                </p>
                <a
                    href="#"
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
                >
                    {t("voting:detail.statusSidebar.help.contact")}{" "}
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </a>
            </div>
        </div>
    );
}
