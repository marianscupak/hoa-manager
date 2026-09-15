import { AlertTriangle, Check, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button, StatusChip, formatFraction } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { VoteDetailResponseDto } from "@/api/generated/model";

import type { WizardStepId } from "..";

export interface ReviewCheck {
    code: string;
    ok: boolean;
    severity: "error" | "warning";
    step: WizardStepId;
}

/**
 * Drives the review checklist so the chair sees problems before submitting,
 * and gates the schedule button via `scheduleDisabled` in the wizard shell.
 * Every check mirrors a server `INCOMPLETE_VOTE` code (see
 * `voting:detail.validation.errors.*`); the server remains the source of
 * truth — `useScheduleVote` + `ScheduleValidationModal` still handle any
 * mismatch.
 *
 * Only conditions that no single wizard step can catch belong here. Date
 * ordering and the per-rollam floor are enforced by `buildFormSchema` on the
 * details step, question wording and answer options by `questionSchema` on
 * the questions step; repeating them made the list a wall of green ticks
 * that said nothing.
 */
export function buildReviewChecks(vote: VoteDetailResponseDto): ReviewCheck[] {
    const from = vote.scheduledFrom ? new Date(vote.scheduledFrom) : null;
    const to = vote.scheduledTo ? new Date(vote.scheduledTo) : null;
    const checks: ReviewCheck[] = [
        {
            code: "VOTE_SCHEDULE_MISSING_DATES",
            ok: !!from && !!to,
            severity: "error",
            step: "details",
        },
        {
            code: "VOTE_SCHEDULE_IN_PAST",
            ok: !from || from.getTime() > Date.now(),
            severity: "error",
            step: "details",
        },
        {
            code: "VOTE_RULESET_REQUIRED",
            ok: !!vote.ruleset,
            severity: "error",
            step: "rules",
        },
        {
            code: "VOTE_MISSING_QUESTIONS",
            ok: vote.questions.length > 0,
            severity: "error",
            step: "questions",
        },
    ];

    return checks;
}

interface ReviewCheckRowProps {
    check: ReviewCheck;
    onEditStep: (id: WizardStepId) => void;
}

function ReviewCheckRow({ check, onEditStep }: ReviewCheckRowProps) {
    const { t } = useTranslation(["voting"]);

    const Icon = check.ok
        ? Check
        : check.severity === "warning"
          ? AlertTriangle
          : X;

    return (
        <div
            className={cn(
                "rounded-panel bg-card flex items-center gap-3 border p-4",
                check.ok
                    ? "border-border"
                    : check.severity === "warning"
                      ? "border-warning-tint-border bg-warning-muted"
                      : "border-destructive/30",
            )}
        >
            <span
                className={cn(
                    "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full",
                    check.ok
                        ? "bg-success-muted text-success-tint-foreground"
                        : check.severity === "warning"
                          ? "bg-warning-muted text-warning-tint-foreground"
                          : "bg-destructive-muted text-destructive-muted-foreground",
                )}
            >
                <Icon className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="flex-1 text-sm font-medium">
                {t(`voting:wizard.review.checks.${check.code}`, {
                    defaultValue: check.code,
                })}
            </span>
            {!check.ok && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditStep(check.step)}
                >
                    {t("voting:wizard.review.edit")}
                </Button>
            )}
        </div>
    );
}

/**
 * Vote-level ruleset facts the admin should see one last time before
 * scheduling: the mode, the assembly quorum (per-rollam has none by law, so
 * it's omitted rather than shown as "none"), and the majority bar. Fractions
 * render via formatFraction + the comparator word, matching how the ruleset
 * step's threshold picker presents them.
 */
function RulesetSummary({ vote }: { vote: VoteDetailResponseDto }) {
    const { t } = useTranslation(["voting"]);
    const ruleset = vote.ruleset;
    if (!ruleset) return null;

    const comparatorWord = (comparator: string) =>
        t(`voting:create.thresholdPicker.comparator.${comparator}`, {
            defaultValue: comparator,
        });

    return (
        <div className="rounded-card border-hairline bg-card border p-5">
            <div className="mb-3 flex items-center gap-2">
                <StatusChip variant="neutral" dot={false}>
                    {t(`voting:create.mode.${vote.mode}.title`)}
                </StatusChip>
            </div>
            <div className="space-y-1.5 text-sm">
                {vote.mode === "ASSEMBLY_RECORD" && ruleset.quorum && (
                    <p>
                        {t("voting:wizard.review.quorumLine", {
                            comparator: comparatorWord(
                                ruleset.quorum.comparator,
                            ),
                            threshold: formatFraction(ruleset.quorum.threshold),
                        })}
                    </p>
                )}
                <p>
                    {t("voting:wizard.review.majorityLine", {
                        comparator: comparatorWord(ruleset.majorityComparator),
                        threshold: formatFraction(ruleset.majorityThreshold),
                    })}
                </p>
            </div>
        </div>
    );
}

export interface ReviewStepProps {
    vote: VoteDetailResponseDto;
    onEditStep: (id: WizardStepId) => void;
    /** Opens the existing schedule confirm dialog owned by `index.tsx`. */
    onScheduleClick: () => void;
    /** True while scheduling is pending or a blocking (error-severity) check fails. */
    scheduleDisabled: boolean;
}

export function ReviewStep({
    vote,
    onEditStep,
    onScheduleClick,
    scheduleDisabled,
}: ReviewStepProps) {
    const { t } = useTranslation(["voting"]);
    const checks = buildReviewChecks(vote);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight">
                    {t("voting:wizard.review.title")}
                </h1>
            </div>

            <div className="flex flex-col gap-3">
                {checks.map((check) => (
                    <ReviewCheckRow
                        key={check.code}
                        check={check}
                        onEditStep={onEditStep}
                    />
                ))}
            </div>

            <RulesetSummary vote={vote} />

            <div className="rounded-card border-hairline bg-card shadow-clay-card border p-5">
                <h2 className="font-display text-base font-extrabold">
                    {t("voting:wizard.review.scheduleTitle")}
                </h2>
                <p className="text-muted-foreground text-detail mt-1.5 mb-4 leading-[19px]">
                    {t("voting:wizard.review.scheduleCopy")}
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        type="button"
                        onClick={onScheduleClick}
                        disabled={scheduleDisabled}
                    >
                        <Send />
                        {t("voting:wizard.review.scheduleAction")}
                    </Button>
                    <Button type="button" variant="ghost" asChild>
                        <Link to="/voting">
                            {t("voting:wizard.review.keepDraft")}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
