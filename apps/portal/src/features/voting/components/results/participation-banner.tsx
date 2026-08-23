import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    type SetVoteRulesetResponseDto,
    type VoteResultsResponseDto,
} from "@/api/generated/model";
import { Card, fractionToTrimmedPercentString } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

export interface ParticipationStats {
    /** Participation %, computed in the vote's quorum measure (0-100, unrounded). */
    pct: number;
    /** Participating unit count — always a literal unit count, regardless of measure. */
    units: number;
    /** Total eligible unit count. */
    total: number;
    /** True when the vote's quorum measure counts units rather than shares. */
    isUnitCount: boolean;
}

/**
 * Shared by ParticipationBanner and VerdictCard (for the reasonNoQuorum
 * sentence's `turnout`), so both surfaces report the exact same number for
 * "how many took part" — quorum is vote-level (spec §3), so there is only
 * ever one participation figure for the whole vote. Quorum only exists for
 * ASSEMBLY_RECORD votes — `ruleset.quorum` is `null` for PER_ROLLAM, in
 * which case the weight axis is used (matching the weight-based
 * `participationPercent` the server always computes).
 */
export function computeParticipationStats(
    results: VoteResultsResponseDto,
    ruleset: SetVoteRulesetResponseDto | null | undefined,
): ParticipationStats {
    const isUnitCount = ruleset?.quorum?.measure === "UNIT_COUNT";
    const pct = isUnitCount
        ? results.totalVotesUnitCount > 0
            ? (results.participationUnitCount / results.totalVotesUnitCount) *
              100
            : 0
        : Number(results.participationPercent);

    return {
        pct,
        units: results.participationUnitCount,
        total: results.totalVotesUnitCount,
        isUnitCount,
    };
}

/**
 * The quorum threshold as a 0-100 percent, for the participation bar's tick
 * mark position and width math. `50` is the display default when the vote
 * has no quorum (PER_ROLLAM) — mirrors the prior `quorumThreshold ?? 50`
 * default. Numeric on purpose (CSS `left`/`width` need a number, and a tiny
 * float error there is invisible) — for user-facing text use
 * deriveQuorumThresholdPercentLabel instead.
 */
export function deriveQuorumThresholdPercent(
    ruleset: SetVoteRulesetResponseDto | null | undefined,
): number {
    if (!ruleset?.quorum) return 50;
    return (ruleset.quorum.threshold.num / ruleset.quorum.threshold.den) * 100;
}

/**
 * Text-display counterpart to deriveQuorumThresholdPercent: same "50 when
 * there's no quorum" default, but rendered via the BigInt-safe fraction
 * formatter (rounded to 2dp, trailing zeros trimmed) instead of a raw float
 * division, since this string is shown to the user rather than fed to CSS.
 * Not clamped to 100 — unlike the numeric version, this is never used to
 * position anything, so an out-of-range ruleset (not currently possible via
 * the wizard, but not schema-enforced either) is more honestly reported
 * as-is than silently capped.
 */
export function deriveQuorumThresholdPercentLabel(
    ruleset: SetVoteRulesetResponseDto | null | undefined,
): string {
    if (!ruleset?.quorum) return "50";
    return fractionToTrimmedPercentString(ruleset.quorum.threshold);
}

interface ParticipationBannerProps {
    results: VoteResultsResponseDto;
    ruleset: SetVoteRulesetResponseDto | null | undefined;
}

export function ParticipationBanner({
    results,
    ruleset,
}: ParticipationBannerProps) {
    const { t } = useTranslation(["voting"]);
    const { pct, units, total, isUnitCount } = computeParticipationStats(
        results,
        ruleset,
    );
    const threshold = Math.min(deriveQuorumThresholdPercent(ruleset), 100);
    const thresholdLabel = deriveQuorumThresholdPercentLabel(ruleset);

    // The weight axis has a server-computed percent string (exact Rational
    // math via toPercentString) — display it verbatim rather than
    // round-tripping it through Number()/toFixed(1). The UNIT_COUNT quorum
    // measure has no server-side percent field to fall back to (the wire
    // only carries literal unit counts for that axis), so its plain integer
    // division stays; it's small-integer arithmetic, not the BigInt-losing
    // kind the fraction work was about.
    const participationDisplay = isUnitCount
        ? pct.toFixed(1)
        : results.participationPercent;
    const participationExactTitle = isUnitCount
        ? undefined
        : t("resultsV2.participationExactTitle", {
              participationNum: results.participationWeight.num,
              participationDen: results.participationWeight.den,
              totalNum: results.totalVotesWeight.num,
              totalDen: results.totalVotesWeight.den,
          });

    // Quorum only exists for ASSEMBLY_RECORD votes; PER_ROLLAM has none by
    // law (§ 1214) and reports `quorumMet: null`, which is not the same as
    // "failed" — it must not render as a warning.
    const quorumDotClass =
        results.quorumMet === null
            ? "bg-info"
            : results.quorumMet
              ? "bg-success"
              : "bg-warning";
    const quorumText =
        results.quorumMet === null
            ? t("results.perRollamDenominator")
            : t(
                  results.quorumMet
                      ? "resultsV2.quorumMetLine"
                      : "resultsV2.quorumNotMetLine",
                  { threshold: thresholdLabel },
              );

    const [animated, setAnimated] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setAnimated(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <Card className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
            <div className="shrink-0">
                <p
                    className={cn(
                        "font-display text-[32px] leading-9 font-black tracking-tight",
                        participationExactTitle && "cursor-help",
                    )}
                    title={participationExactTitle}
                >
                    {participationDisplay} %
                </p>
            </div>
            <div className="w-full min-w-0 flex-1">
                <p className="mb-3 text-[14.5px] font-semibold">
                    {/* The headline % is already measure-aware, so the
                        sentence has to name the same basis: a UNIT_COUNT
                        vote's turnout is a share of units, not of building
                        shares. */}
                    {t(
                        isUnitCount
                            ? "resultsV2.participationLineUnits"
                            : "resultsV2.participationLine",
                        {
                            pct: participationDisplay,
                            units,
                            total,
                        },
                    )}
                </p>
                <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold">
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${quorumDotClass}`}
                    />
                    <span>{quorumText}</span>
                </div>
                <div className="bg-muted relative mt-5 h-3.5 rounded-full">
                    <div
                        className="bg-primary h-3.5 rounded-full motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                        style={{
                            width: `${animated ? Math.min(pct, 100) : 0}%`,
                        }}
                    />
                    {/* No quorum tick for PER_ROLLAM (quorumMet === null) —
                        there is no threshold to mark; showing one would
                        contradict the perRollamDenominator line above. */}
                    {results.quorumMet !== null && (
                        <>
                            <div
                                className="bg-foreground/40 absolute top-0 h-full w-0.5 rounded-full"
                                style={{ left: `${threshold}%` }}
                            />
                            <span
                                className="text-muted-foreground absolute -top-5 -translate-x-1/2 text-[10.5px] font-semibold whitespace-nowrap"
                                style={{ left: `${threshold}%` }}
                            >
                                {thresholdLabel} %
                            </span>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
}
