import { format } from "date-fns";
import { cs, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type { VoteListItemResponseDto } from "@/api/generated/model";
import { useVotesControllerGetVotes } from "@/api/generated/votes/votes";

interface ComingUpRow {
    key: string;
    kind: "opens" | "closes";
    date: Date;
    voteId: string;
    title: string;
}

function buildRows(votes: VoteListItemResponseDto[]): ComingUpRow[] {
    const rows: ComingUpRow[] = [];
    for (const vote of votes) {
        if (vote.status === "SCHEDULED" && vote.scheduledFrom) {
            rows.push({
                key: `${vote.id}-opens`,
                kind: "opens",
                date: new Date(vote.scheduledFrom),
                voteId: vote.id,
                title: vote.title,
            });
        }
        if (
            (vote.status === "OPEN" || vote.status === "SCHEDULED") &&
            vote.scheduledTo
        ) {
            rows.push({
                key: `${vote.id}-closes`,
                kind: "closes",
                date: new Date(vote.scheduledTo),
                voteId: vote.id,
                title: vote.title,
            });
        }
    }
    return rows.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function ComingUpSection() {
    const { t, i18n } = useTranslation("dashboard");
    const locale = i18n.language === "cs" ? cs : enUS;
    const votesQuery = useVotesControllerGetVotes(
        { status: ["OPEN", "SCHEDULED"] },
        { query: { staleTime: 0, refetchOnMount: "always" } },
    );

    const rows = buildRows(votesQuery.data ?? []);
    if (rows.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-muted-foreground text-[13px] font-semibold tracking-wide uppercase">
                    {t("comingUp.sectionTitle")}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5 pt-0">
                {rows.map((row) => (
                    <Link
                        key={row.key}
                        to={`/voting/${row.voteId}`}
                        className="hover:bg-muted -mx-2 flex items-center gap-3.5 rounded-lg px-2 py-1 transition-colors"
                    >
                        <div
                            className={cn(
                                "rounded-tile flex h-11 w-11 shrink-0 flex-col items-center justify-center",
                                row.kind === "opens"
                                    ? "bg-primary-tint shadow-clay-inset-lg"
                                    : "bg-warning-muted shadow-[inset_0_-3px_0_rgba(245,158,11,0.15)]",
                            )}
                        >
                            <span className="font-display text-base leading-none font-black">
                                {format(row.date, "d")}
                            </span>
                            <span className="text-muted-foreground mt-0.5 text-[10px] leading-none uppercase">
                                {format(row.date, "LLL", { locale })}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                                {row.title}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                {t(
                                    row.kind === "opens"
                                        ? "comingUp.opens"
                                        : "comingUp.closes",
                                )}
                            </p>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}
