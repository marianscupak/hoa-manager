import {
    AlertTriangle,
    ArrowRight,
    Calendar,
    CheckCircle2,
    Pencil,
    Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { VoteListItemResponseDto } from "@/api/generated/model";

interface VoteStatusSectionProps {
    vote: VoteListItemResponseDto;
}

export function VoteStatusSection({ vote }: VoteStatusSectionProps) {
    const { t } = useTranslation(["voting"]);
    const summary = vote.voterSummary;

    if (vote.status === "OPEN") {
        return (
            <div className="flex flex-col items-center">
                <div className="mb-4 flex flex-col items-center text-center">
                    {summary?.canVote ? (
                        <StatusDisplay
                            icon={CheckCircle2}
                            iconColor="text-emerald-500"
                            title={t("list.card.canVote")}
                            subtitle={t("list.card.voteRequired")}
                        />
                    ) : summary?.isDelegated ? (
                        <StatusDisplay
                            icon={Users}
                            iconColor="text-slate-500"
                            title={t("list.card.alreadyDelegatedOpen")}
                            subtitle={t(
                                "list.card.alreadyDelegatedOpenSubtitle",
                            )}
                        />
                    ) : (
                        <StatusDisplay
                            icon={AlertTriangle}
                            iconColor="text-slate-400"
                            title={t("list.card.cannotVoteOpen")}
                            subtitle={t("list.card.cannotVoteOpenSubtitle")}
                        />
                    )}
                </div>
                <ActionButton
                    to={`/voting/${vote.id}`}
                    label={
                        summary?.canVote
                            ? t("list.card.voteAction")
                            : t("list.card.viewDetails")
                    }
                />
            </div>
        );
    }

    if (vote.status === "SCHEDULED") {
        return (
            <div className="flex flex-col items-center">
                <div className="mb-4 flex flex-col items-center text-center">
                    {summary?.requiresDelegation ? (
                        <StatusDisplay
                            icon={Users}
                            iconColor="text-orange-500"
                            title={t("list.card.delegationNeeded")}
                            subtitle={t("list.card.fromCoOwners")}
                        />
                    ) : summary?.canVote ? (
                        <StatusDisplay
                            icon={CheckCircle2}
                            iconColor="text-emerald-500"
                            title={t("list.card.readyToVote")}
                            subtitle={t("list.card.readyToVoteSubtitle")}
                        />
                    ) : summary?.isDelegated ? (
                        <StatusDisplay
                            icon={Users}
                            iconColor="text-slate-500"
                            title={t("list.card.alreadyDelegated")}
                            subtitle={t("list.card.alreadyDelegatedSubtitle")}
                        />
                    ) : (
                        <StatusDisplay
                            icon={Calendar}
                            iconColor="text-blue-500"
                            title={t("list.card.scheduledStatus")}
                            subtitle={t("list.card.scheduledSubtitle")}
                        />
                    )}
                </div>
                {summary?.requiresDelegation ? (
                    <ActionButton
                        to={`/voting/${vote.id}/delegate`}
                        label={t("list.card.manageDelegation")}
                    />
                ) : (
                    <ActionButton
                        to={`/voting/${vote.id}`}
                        label={t("list.card.viewDetails")}
                    />
                )}
            </div>
        );
    }

    if (vote.status === "DRAFT") {
        return (
            <div className="flex flex-col items-center">
                <StatusDisplay
                    icon={Pencil}
                    iconColor="text-slate-500"
                    title={t("list.card.draftStatus")}
                    subtitle={t("list.card.editDraft")}
                />
                <Button variant="outline" className="w-full" asChild>
                    <Link to={`/voting/${vote.id}/edit`}>
                        {t("list.card.editAction")}
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            <StatusDisplay
                icon={CheckCircle2}
                iconColor="text-slate-400"
                title={t("list.card.completed")}
                subtitle={t("list.card.viewOutcomes")}
            />
            <Button
                variant="outline"
                className="w-full border-slate-200"
                asChild
            >
                <Link to={`/voting/${vote.id}`}>
                    {t("list.card.viewResults")}{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
    );
}

interface StatusDisplayProps {
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    title: string;
    subtitle?: string;
}

function StatusDisplay({
    icon: Icon,
    iconColor,
    title,
    subtitle,
}: StatusDisplayProps) {
    return (
        <div className="mb-4 flex flex-col items-center text-center">
            <Icon className={cn("mb-2 h-8 w-8", iconColor)} />
            <span className="font-semibold text-slate-700">{title}</span>
            {subtitle && (
                <span className="text-sm text-slate-500">{subtitle}</span>
            )}
        </div>
    );
}

interface ActionButtonProps {
    to: string;
    label: string;
}

function ActionButton({ to, label }: ActionButtonProps) {
    return (
        <Button
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
            asChild
        >
            <Link to={to}>
                {label} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
    );
}
