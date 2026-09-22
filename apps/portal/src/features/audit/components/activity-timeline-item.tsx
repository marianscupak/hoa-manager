import { format } from "date-fns";
import { cs, enUS } from "date-fns/locale";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
    getOptionLabel,
    resolveAnswerOptionKey,
} from "@/features/voting/utils/option-label";

import { type ActivityTimelineEntry } from "./activity-timeline";
import { getEventTypeMeta } from "./event-type-meta";

interface ActivityTimelineItemProps {
    entry: ActivityTimelineEntry;
    isLast: boolean;
}

interface BallotAnswer {
    questionText: string;
    optionText: string;
    /** Recorded since the option key travels with the label; older entries
     *  lack it and fall back to the stored label (see resolveAnswerOptionKey). */
    optionKey?: string;
}

function getBallotAnswers(
    details: Record<string, unknown> | undefined,
): BallotAnswer[] | null {
    if (!details) return null;
    const answers = (details as { answers?: unknown }).answers;
    if (!Array.isArray(answers)) return null;
    const parsed = answers.filter(
        (a): a is BallotAnswer =>
            typeof a === "object" &&
            a !== null &&
            typeof (a as BallotAnswer).questionText === "string" &&
            typeof (a as BallotAnswer).optionText === "string",
    );
    return parsed.length > 0 ? parsed : null;
}

export function ActivityTimelineItem({
    entry,
    isLast,
}: ActivityTimelineItemProps) {
    const { t, i18n } = useTranslation(["voting", "audit"]);
    const { icon: Icon, dotColor } = getEventTypeMeta(entry.eventType);
    const headline = t(entry.eventType, {
        ns: "audit",
        defaultValue: t("UNKNOWN", { ns: "audit" }),
    });
    const ballotAnswers = getBallotAnswers(entry.details);
    const hasDetails = ballotAnswers !== null;
    const [expanded, setExpanded] = useState(false);
    const locale = i18n.language === "cs" ? cs : enUS;
    const formattedTimestamp = format(
        new Date(entry.occurredAt),
        "d. M. yyyy HH:mm",
        { locale },
    );

    return (
        <li className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
                <span
                    aria-hidden="true"
                    className="bg-border absolute top-6 left-3 -ml-px h-full w-0.5"
                />
            )}
            <span
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${dotColor}`}
            >
                <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                        {formattedTimestamp}
                    </span>
                    <span className="text-faint">·</span>
                    {entry.navigateTo ? (
                        <Link
                            to={entry.navigateTo}
                            className="text-foreground text-sm font-semibold hover:underline"
                        >
                            {headline}
                        </Link>
                    ) : (
                        <span className="text-foreground text-sm font-semibold">
                            {headline}
                        </span>
                    )}
                    {hasDetails && (
                        <button
                            type="button"
                            onClick={() => setExpanded((v) => !v)}
                            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring ml-auto inline-flex cursor-pointer items-center gap-1 rounded-sm text-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            aria-expanded={expanded}
                        >
                            {expanded ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                            )}
                            {expanded
                                ? t("voting:results.activity.collapseDetails")
                                : t("voting:results.activity.expandDetails")}
                        </button>
                    )}
                </div>
                <p className="text-secondary-foreground mt-1 text-sm">
                    {entry.message}
                </p>
                {hasDetails && expanded && ballotAnswers && (
                    <ul className="text-secondary-foreground mt-2 list-disc space-y-1 pl-5 text-sm">
                        {ballotAnswers.map((a, i) => (
                            <li key={i}>
                                <span className="font-medium">
                                    {a.questionText}
                                </span>
                                <span className="text-muted-foreground">
                                    {" "}
                                    —{" "}
                                </span>
                                <span>
                                    {getOptionLabel(
                                        resolveAnswerOptionKey(a),
                                        a.optionText,
                                        t,
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </li>
    );
}
