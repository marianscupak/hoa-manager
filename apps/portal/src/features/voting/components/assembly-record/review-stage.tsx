import {
    AlertTriangle,
    ArrowLeft,
    ArrowUp,
    Check,
    Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button, Checkbox, formatPercent } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type { AssemblyRecordResponseDto } from "@/api/generated/model";
import { sharePercent } from "@/features/units/utils/shares";

import { OutcomeCard } from "./outcome-card";
import type { PublishCheck } from "./publish-checklist";

interface ReviewStageProps {
    voteId: string;
    record: AssemblyRecordResponseDto;
    checks: PublishCheck[];
    confirmed: boolean;
    onConfirmedChange: (value: boolean) => void;
    onPublish: () => void;
    isPublishing: boolean;
    /** Null when the shortcut cannot be offered — see the page for why. */
    onRecordAllAbstain: (() => void) | null;
    isSaving: boolean;
}

interface CheckCopy {
    title: string;
    body: string;
    action?: { label: string; to?: string; onClick?: () => void };
}

export function ReviewStage({
    voteId,
    record,
    checks,
    confirmed,
    onConfirmedChange,
    onPublish,
    isPublishing,
    onRecordAllAbstain,
    isSaving,
}: ReviewStageProps) {
    const { t } = useTranslation(["voting"]);
    const totals = record.totals;
    const recordingHref = `/voting/${voteId}/assembly-record`;

    // Every group as a percentage of all the votes in the building. Ratios of
    // weights rather than the weights themselves, so this reads correctly
    // under ONE_UNIT_ONE_VOTE too, where every unit weighs 1.
    const allVotes =
        sharePercent(
            Number(totals.allVotesWeight.num),
            Number(totals.allVotesWeight.den),
        ) || 1;
    const groupPercent = (attendance: "PRESENT" | "ABSENT" | null) =>
        (record.units
            .filter((u) =>
                attendance === null
                    ? u.eligibility === "INELIGIBLE"
                    : u.attendance === attendance,
            )
            .reduce(
                (sum, u) =>
                    sum +
                    sharePercent(Number(u.share.num), Number(u.share.den)),
                0,
            ) /
            allVotes) *
        100;

    const presentPercent = groupPercent("PRESENT");
    const absentPercent = groupPercent("ABSENT");
    const ineligiblePercent = groupPercent(null);

    const meetingDate = record.meetingDate
        ? new Date(record.meetingDate).toLocaleString()
        : null;
    const entered = totals.presentUnitCount - totals.unitsAwaitingEntry;
    const unaccounted =
        record.units.length -
        (totals.presentUnitCount +
            totals.absentUnitCount +
            totals.ineligibleUnitCount);

    const copyFor = (check: PublishCheck): CheckCopy => {
        switch (check.code) {
            case "ATTENDANCE_COMPLETE": {
                const review = {
                    label: t(
                        "voting:assemblyRecord.review.checks.attendanceAction",
                    ),
                    to: recordingHref,
                };
                if (totals.presentUnitCount + totals.absentUnitCount === 0) {
                    return {
                        title: t(
                            "voting:assemblyRecord.review.checks.attendanceEmptyTitle",
                        ),
                        body: t(
                            "voting:assemblyRecord.review.checks.attendanceEmptyBody",
                        ),
                        action: review,
                    };
                }
                if (!check.ok) {
                    return {
                        title: t(
                            "assemblyRecord.review.checks.attendanceMissingTitle",
                            { count: unaccounted },
                        ),
                        body: t(
                            "voting:assemblyRecord.review.checks.attendanceMissingBody",
                        ),
                        action: review,
                    };
                }
                return {
                    title: t(
                        "voting:assemblyRecord.review.checks.attendanceOkTitle",
                        { total: record.units.length },
                    ),
                    body: t(
                        "voting:assemblyRecord.review.checks.attendanceOkBody",
                        {
                            present: totals.presentUnitCount,
                            absent: totals.absentUnitCount,
                            ineligible: totals.ineligibleUnitCount,
                        },
                    ),
                    action: review,
                };
            }
            case "ANSWERS_COMPLETE":
                if (check.ok) {
                    return {
                        title: t(
                            "voting:assemblyRecord.review.checks.answersOkTitle",
                        ),
                        body: t("assemblyRecord.review.checks.answersOkBody", {
                            count: entered,
                        }),
                    };
                }
                return {
                    title: t(
                        "assemblyRecord.review.checks.answersMissingTitle",
                        { count: totals.unitsAwaitingEntry },
                    ),
                    body: t(
                        "voting:assemblyRecord.review.checks.answersMissingBody",
                    ),
                    action: onRecordAllAbstain
                        ? {
                              label: t(
                                  "voting:assemblyRecord.review.checks.answersActionAbstain",
                              ),
                              onClick: onRecordAllAbstain,
                          }
                        : {
                              label: t(
                                  "voting:assemblyRecord.review.checks.answersActionGo",
                              ),
                              to: recordingHref,
                          },
                };
            case "QUORATE":
                return {
                    title: t(
                        check.ok
                            ? "voting:assemblyRecord.review.quorumOkTitle"
                            : "voting:assemblyRecord.review.quorumShortTitle",
                    ),
                    body: t("voting:assemblyRecord.review.checks.quorumBody", {
                        percent: formatPercent(presentPercent, 1),
                    }),
                };
            default:
                if (check.ok) {
                    return {
                        title: t(
                            "voting:assemblyRecord.review.checks.dateOkTitle",
                        ),
                        body: meetingDate ?? "",
                    };
                }
                // No action offered: the vote is frozen against edits as
                // soon as it carries a ballot, so a link to the edit screen
                // would only lead to a 409.
                return {
                    title: t(
                        "voting:assemblyRecord.review.checks.dateMissingTitle",
                    ),
                    body: t(
                        "voting:assemblyRecord.review.checks.dateMissingBody",
                    ),
                };
        }
    };

    const blocked = checks.some((c) => c.blocking && !c.ok);
    const withPreview = record.questions.filter((q) => q.preview);

    return (
        <main className="mx-auto max-w-[840px] space-y-3.5 px-4 py-6 pb-16">
            <Link
                to={recordingHref}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("voting:assemblyRecord.review.back")}
            </Link>

            <div>
                <h1 className="font-display text-[28px] leading-8 font-black tracking-[-0.4px]">
                    {t("voting:assemblyRecord.review.title")}
                </h1>
                <p className="text-muted-foreground mt-1.5 text-sm leading-[21px]">
                    {t("voting:assemblyRecord.review.lead")}
                </p>
            </div>

            <div className="rounded-card bg-card shadow-clay-card border p-4 px-5">
                <p className="text-faint text-[11px] font-semibold tracking-wide uppercase">
                    {t("voting:assemblyRecord.review.attendanceEyebrow")}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Stat
                        value={totals.presentUnitCount}
                        label={t("voting:assemblyRecord.review.statPresent", {
                            percent: formatPercent(presentPercent, 1),
                        })}
                    />
                    <Stat
                        value={totals.absentUnitCount}
                        label={t("voting:assemblyRecord.review.statAbsent", {
                            percent: formatPercent(absentPercent, 1),
                        })}
                        muted
                    />
                    <Stat
                        value={totals.ineligibleUnitCount}
                        label={t(
                            "voting:assemblyRecord.review.statIneligible",
                            { percent: formatPercent(ineligiblePercent, 1) },
                        )}
                        muted
                    />
                </div>
                <div className="bg-accent mt-4 flex h-2.5 overflow-hidden rounded-full">
                    <div
                        className="bg-primary h-full"
                        style={{ width: `${presentPercent}%` }}
                    />
                    <div
                        className="bg-faint h-full"
                        style={{ width: `${absentPercent}%` }}
                    />
                </div>
            </div>

            <div
                className={cn(
                    "flex gap-3 rounded-2xl border p-4 px-5",
                    totals.quorate
                        ? "border-success-tint-border bg-success-muted"
                        : "border-warning-tint-border bg-warning-muted",
                )}
            >
                <span
                    className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white",
                        totals.quorate ? "bg-success" : "bg-warning",
                    )}
                >
                    {totals.quorate ? (
                        <Check className="h-4 w-4" strokeWidth={3} />
                    ) : (
                        <AlertTriangle className="h-4 w-4" />
                    )}
                </span>
                <div
                    className={
                        totals.quorate
                            ? "text-success-tint-foreground"
                            : "text-warning-tint-foreground"
                    }
                >
                    <p className="text-sm font-bold">
                        {t(
                            totals.quorate
                                ? "voting:assemblyRecord.review.quorumOkTitle"
                                : "voting:assemblyRecord.review.quorumShortTitle",
                        )}
                    </p>
                    <p className="mt-1 text-[13px] leading-[19px]">
                        {t(
                            totals.quorate
                                ? "voting:assemblyRecord.review.quorumOkBody"
                                : "voting:assemblyRecord.review.quorumShortBody",
                            { percent: formatPercent(presentPercent, 1) },
                        )}
                    </p>
                </div>
            </div>

            <div className="rounded-card bg-card shadow-clay-card overflow-hidden border">
                <p className="text-faint px-5 pt-4 pb-2.5 text-[11px] font-semibold tracking-wide uppercase">
                    {t("voting:assemblyRecord.review.checksEyebrow")}
                </p>
                {checks.map((check) => {
                    const copy = copyFor(check);
                    return (
                        <div
                            key={check.code}
                            className={cn(
                                "flex items-start gap-3 border-t px-5 py-3.5",
                                !check.ok && "bg-warning-muted/40",
                            )}
                        >
                            <span
                                className={cn(
                                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white",
                                    check.ok ? "bg-success" : "bg-warning",
                                )}
                            >
                                {check.ok ? (
                                    <Check
                                        className="h-3 w-3"
                                        strokeWidth={3}
                                    />
                                ) : (
                                    <AlertTriangle className="h-3 w-3" />
                                )}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold">
                                    {copy.title}
                                </p>
                                <p className="text-muted-foreground mt-0.5 text-[13px] leading-[19px]">
                                    {copy.body}
                                </p>
                            </div>
                            {copy.action?.to && (
                                <Link
                                    to={copy.action.to}
                                    className="text-primary hover:text-primary/80 shrink-0 text-[13px] font-semibold"
                                >
                                    {copy.action.label}
                                </Link>
                            )}
                            {copy.action?.onClick && (
                                <button
                                    type="button"
                                    onClick={copy.action.onClick}
                                    disabled={isSaving}
                                    className="text-primary hover:text-primary/80 shrink-0 cursor-pointer text-[13px] font-semibold disabled:opacity-50"
                                >
                                    {copy.action.label}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="text-faint pt-1 text-[11px] font-semibold tracking-wide uppercase">
                {t("voting:assemblyRecord.review.outcomesEyebrow")}
            </p>
            {record.questions.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    {t("voting:assemblyRecord.review.noQuestions")}
                </p>
            ) : withPreview.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    {t("voting:assemblyRecord.review.noPreview")}
                </p>
            ) : (
                <>
                    {withPreview.map((question, index) => (
                        <OutcomeCard
                            key={question.questionId}
                            index={index + 1}
                            question={question}
                            quorate={totals.quorate}
                        />
                    ))}
                    <p className="text-faint text-[11.5px]">
                        {t(
                            withPreview[0].preview!.majorityDenominator.num ===
                                totals.allVotesWeight.num &&
                                withPreview[0].preview!.majorityDenominator
                                    .den === totals.allVotesWeight.den
                                ? "voting:assemblyRecord.review.denominatorAllVotes"
                                : "voting:assemblyRecord.review.denominatorVotesCast",
                        )}
                    </p>
                </>
            )}

            <div className="rounded-card border-primary-tint bg-primary-tint/30 shadow-clay-card border p-5">
                <p className="font-display text-[17px] font-extrabold tracking-tight">
                    {t("voting:assemblyRecord.review.publishTitle")}
                </p>
                <p className="text-secondary-foreground mt-1.5 text-[13.5px] leading-5">
                    {t("voting:assemblyRecord.review.publishBody")}
                </p>

                <label className="bg-card mt-3.5 flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3.5 px-4">
                    <Checkbox
                        checked={confirmed}
                        onCheckedChange={(value) =>
                            onConfirmedChange(value === true)
                        }
                    />
                    <span className="text-[13.5px]">
                        {meetingDate
                            ? t(
                                  "voting:assemblyRecord.review.confirmWithDate",
                                  { date: meetingDate },
                              )
                            : t("voting:assemblyRecord.review.confirm")}
                    </span>
                </label>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <Button
                        onClick={onPublish}
                        disabled={!confirmed || blocked || isPublishing}
                    >
                        {isPublishing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowUp className="h-4 w-4" />
                        )}
                        {t("voting:assemblyRecord.review.publish")}
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to={recordingHref}>
                            {t("voting:assemblyRecord.review.keepRecording")}
                        </Link>
                    </Button>
                    {blocked && (
                        <span className="text-warning-tint-foreground text-[12.5px]">
                            {t("voting:assemblyRecord.review.blocked")}
                        </span>
                    )}
                </div>
            </div>
        </main>
    );
}

function Stat({
    value,
    label,
    muted,
}: {
    value: number;
    label: string;
    muted?: boolean;
}) {
    return (
        <div>
            <p
                className={cn(
                    "font-display text-[24px] leading-7 font-black tracking-[-0.4px]",
                    muted && "text-secondary-foreground",
                )}
            >
                {value}
            </p>
            <p className="text-muted-foreground text-[12.5px]">{label}</p>
        </div>
    );
}
