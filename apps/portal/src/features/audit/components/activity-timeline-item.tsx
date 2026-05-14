import { format } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { type ActivityTimelineEntry } from "./activity-timeline";
import { getEventTypeMeta } from "./event-type-meta";

interface ActivityTimelineItemProps {
    entry: ActivityTimelineEntry;
    isLast: boolean;
}

interface BallotAnswer {
    questionText: string;
    optionText: string;
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
    const { t } = useTranslation(["voting", "audit"]);
    const { icon: Icon, dotColor } = getEventTypeMeta(entry.eventType);
    const headline = t(entry.eventType, {
        ns: "audit",
        defaultValue: t("UNKNOWN", { ns: "audit" }),
    });
    const ballotAnswers = getBallotAnswers(entry.details);
    const hasDetails = ballotAnswers !== null;
    const [expanded, setExpanded] = useState(false);
    const formattedTimestamp = format(
        new Date(entry.occurredAt),
        "d. M. yyyy HH:mm",
    );

    return (
        <li className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
                <span
                    aria-hidden="true"
                    className="absolute top-6 left-3 -ml-px h-full w-0.5 bg-slate-200"
                />
            )}
            <span
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${dotColor}`}
            >
                <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        {formattedTimestamp}
                    </span>
                    <span className="text-slate-300">·</span>
                    {entry.navigateTo ? (
                        <Link
                            to={entry.navigateTo}
                            className="text-sm font-semibold text-slate-800 hover:underline"
                        >
                            {headline}
                        </Link>
                    ) : (
                        <span className="text-sm font-semibold text-slate-800">
                            {headline}
                        </span>
                    )}
                    {hasDetails && (
                        <button
                            type="button"
                            onClick={() => setExpanded((v) => !v)}
                            className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
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
                <p className="mt-1 text-sm text-slate-600">{entry.message}</p>
                {hasDetails && expanded && ballotAnswers && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {ballotAnswers.map((a, i) => (
                            <li key={i}>
                                <span className="font-medium">
                                    {a.questionText}
                                </span>
                                <span className="text-slate-500"> — </span>
                                <span>{a.optionText}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </li>
    );
}
