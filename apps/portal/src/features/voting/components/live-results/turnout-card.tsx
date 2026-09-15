import { useTranslation } from "react-i18next";

import {
    type SetVoteRulesetResponseDto,
    type VoteTurnoutResponseDto,
} from "@/api/generated/model";
import { Card, StatusChip, formatPercentValue } from "@hoa-mngr/ui";

import {
    computeParticipationStats,
    deriveQuorumThresholdPercent,
    deriveQuorumThresholdPercentLabel,
} from "../../utils/participation-stats";

interface TurnoutCardProps {
    turnout: VoteTurnoutResponseDto;
    ruleset: SetVoteRulesetResponseDto | null | undefined;
    /** Rows in the participation snapshot, including units the turnout
     *  denominator leaves out. */
    snapshotUnitCount: number;
}

export function TurnoutCard({
    turnout,
    ruleset,
    snapshotUnitCount,
}: TurnoutCardProps) {
    const { t } = useTranslation("voting");
    const { pct, isUnitCount } = computeParticipationStats(turnout, ruleset);
    const threshold = Math.min(deriveQuorumThresholdPercent(ruleset), 100);

    // Same rule as ParticipationBanner: on the weight axis the server has
    // already done exact Rational math, so its string is shown verbatim
    // rather than round-tripped through Number(). The unit-count axis has no
    // such field and keeps its plain division.
    const participationDisplay = isUnitCount
        ? formatPercentValue(pct, 1)
        : turnout.participationPercent;

    // The headline counts what can still decide the vote; the table lists
    // every unit in the snapshot. Association-owned units sit in the gap, and
    // naming them is the only way the two numbers read as deliberate.
    const excludedCount = snapshotUnitCount - turnout.totalVotesUnitCount;

    return (
        <Card className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
            <div className="shrink-0">
                <p className="font-display text-stat-lg leading-9 font-black tracking-tight">
                    {participationDisplay} %
                </p>
                <p className="text-muted-foreground text-detail">
                    {t(
                        isUnitCount
                            ? "liveResults.turnout.captionUnits"
                            : "liveResults.turnout.caption",
                    )}
                </p>
            </div>

            <div className="w-full min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                    <p className="text-md font-semibold">
                        {t("liveResults.turnout.headline", {
                            voted: turnout.participationUnitCount,
                            total: turnout.totalVotesUnitCount,
                        })}
                    </p>
                    {/* PER_ROLLAM has no quorum and reports null, which is not
                        the same as "not reached" — it gets no chip, but the
                        slot doesn't go empty: the existing per-rollam
                        denominator copy takes its place, matching
                        ParticipationBanner's handling of the same state. */}
                    {turnout.quorumMet !== null ? (
                        <StatusChip
                            variant={turnout.quorumMet ? "success" : "warning"}
                        >
                            {t(
                                turnout.quorumMet
                                    ? "liveResults.turnout.quorumReached"
                                    : "liveResults.turnout.quorumNotReached",
                            )}
                        </StatusChip>
                    ) : (
                        <span className="text-muted-foreground text-detail font-semibold">
                            {t("results.perRollamDenominator")}
                        </span>
                    )}
                </div>

                {excludedCount > 0 && (
                    <p className="text-faint text-detail mt-1.5">
                        {t("liveResults.turnout.excluded", {
                            count: excludedCount,
                        })}
                    </p>
                )}

                <div className="bg-muted relative mt-6 h-3.5 rounded-full">
                    <div
                        className="bg-primary h-3.5 rounded-full motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                    {turnout.quorumMet !== null && (
                        <>
                            <div
                                className="bg-foreground/40 absolute top-0 h-full w-0.5 rounded-full"
                                style={{ left: `${threshold}%` }}
                            />
                            <span
                                className="text-muted-foreground text-2xs absolute -top-5 -translate-x-1/2 font-semibold whitespace-nowrap"
                                style={{ left: `${threshold}%` }}
                            >
                                {t("liveResults.turnout.marker", {
                                    threshold:
                                        deriveQuorumThresholdPercentLabel(
                                            ruleset,
                                        ),
                                })}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
}
