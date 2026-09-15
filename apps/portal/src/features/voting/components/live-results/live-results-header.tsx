import { format } from "date-fns";
import { ArrowLeft, Eye, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { StatusChip } from "@hoa-mngr/ui";

import { StatusBadge } from "../status-badge";

interface LiveResultsHeaderProps {
    voteId: string;
    title: string;
    /** ISO close date. Null when the vote carries none, in which case the
     *  subtitle is dropped rather than interpolating a blank date into it. */
    closesAt: string | null;
    isBoardView: boolean;
}

export function LiveResultsHeader({
    voteId,
    title,
    closesAt,
    isBoardView,
}: LiveResultsHeaderProps) {
    const { t } = useTranslation("voting");

    return (
        <div className="flex flex-col gap-4">
            <Link
                to={`/voting/${voteId}`}
                className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("liveResults.back", { title })}
            </Link>

            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-3xl font-black tracking-tight">
                            {t("liveResults.title")}
                        </h1>
                        {/* A guarantee, not an assumption: the page redirects
                            every status other than OPEN before it renders. */}
                        <StatusBadge status="OPEN" />
                    </div>
                    {closesAt && (
                        <p className="text-muted-foreground mt-2 text-sm">
                            {t("liveResults.subtitle", {
                                date: format(
                                    new Date(closesAt),
                                    "d. M. yyyy HH:mm",
                                ),
                            })}
                        </p>
                    )}
                </div>

                {/* The chip is what tells a reader why they see what they
                    see — the icon carries that meaning, so it replaces the
                    chip's usual state dot. */}
                <StatusChip
                    variant={isBoardView ? "primary" : "neutral"}
                    dot={false}
                    className="shrink-0"
                >
                    {isBoardView ? (
                        <Eye className="h-3.5 w-3.5" />
                    ) : (
                        <Lock className="h-3.5 w-3.5" />
                    )}
                    {t(
                        isBoardView
                            ? "liveResults.roleChip.board"
                            : "liveResults.roleChip.owner",
                    )}
                </StatusChip>
            </div>
        </div>
    );
}
