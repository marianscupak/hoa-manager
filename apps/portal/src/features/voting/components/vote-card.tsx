import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button, Card } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { VoteListItemResponseDto } from "@/api/generated/model";

import { ModeBadge } from "./mode-badge";
import { StatusBadge } from "./status-badge";
import { resolveVoteStatus, VoteStatusLineTone } from "./vote-status-section";

interface VoteCardProps {
    vote: VoteListItemResponseDto;
}

const LINE_TONE_CLASSES: Record<VoteStatusLineTone, string> = {
    destructive: "text-destructive-muted-foreground",
    warning: "text-warning-tint-foreground",
    muted: "text-muted-foreground",
};

export function VoteCard({ vote }: VoteCardProps) {
    const { t } = useTranslation(["voting"]);
    const isDraft = vote.status === "DRAFT";
    const isOpen = vote.status === "OPEN";
    const { line, action } = resolveVoteStatus(vote, t);
    // An open vote is described by when it closes, anything else by when it
    // starts — and a draft may well have only one of the two dates set, so
    // the row is skipped rather than falling back to the epoch.
    const whenDate =
        isOpen && vote.scheduledTo ? vote.scheduledTo : vote.scheduledFrom;

    return (
        <Card
            className={cn(
                "flex items-center gap-5 px-[22px] py-[18px]",
                isDraft && "border-2 border-dashed shadow-none",
            )}
        >
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                    <StatusBadge status={vote.status} />
                    <ModeBadge mode={vote.mode} />
                    <Link
                        to={`/voting/${vote.id}`}
                        className="font-display hover:text-primary-hover text-[16.5px] font-extrabold tracking-tight"
                    >
                        {vote.title}
                    </Link>
                </div>
                {whenDate && (
                    <p className="text-secondary-foreground mt-1.5 text-sm leading-5">
                        {isOpen
                            ? t("list.card.endsOn")
                            : t("list.card.startsOn")}
                        {format(new Date(whenDate), "d. M. yyyy HH:mm")}
                    </p>
                )}
                {!isDraft && (
                    <p className="text-secondary-foreground mt-1.5 text-sm leading-5">
                        {vote.description || t("list.card.noDescription")}
                    </p>
                )}
                {line && (
                    <p
                        className={cn(
                            "mt-1.5 text-sm font-medium",
                            LINE_TONE_CLASSES[line.tone],
                        )}
                    >
                        {line.text}
                    </p>
                )}
            </div>
            <Button
                variant={action.variant ?? "default"}
                className="shrink-0"
                asChild
            >
                <Link to={action.to}>{action.label}</Link>
            </Button>
        </Card>
    );
}
