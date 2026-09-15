import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    type SetVoteRulesetResponseDto,
    type VoteResultsResponseDto,
} from "@/api/generated/model";
import { Card, formatPercentValue } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import {
    computeParticipationStats,
    deriveQuorumThresholdPercent,
    deriveQuorumThresholdPercentLabel,
} from "../../utils/participation-stats";

export {
    computeParticipationStats,
    deriveQuorumThresholdPercent,
    deriveQuorumThresholdPercentLabel,
};

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
    // round-tripping it through Number()/formatPercentValue. The UNIT_COUNT
    // quorum measure has no server-side percent field to fall back to (the
    // wire only carries literal unit counts for that axis), so its plain
    // integer division stays; it's small-integer arithmetic, not the
    // BigInt-losing kind the fraction work was about.
    const participationDisplay = isUnitCount
        ? formatPercentValue(pct, 1)
        : results.participationPercent;
    const participationExactTitle = isUnitCount
        ? undefined
        : t("resultsV2.participationExactTitle", {
              participationNum: results.participationWeight.num,
              participationDen: results.participationWeight.den,
              totalNum: results.totalVotesWeight.num,
              totalDen: results.totalVotesWeight.den,
          });

    // Quorum only exists for ASSEMBLY_RECORD votes; PER_ROLLAM has none under
    // the per-rollam rule and reports `quorumMet: null`, which is not the same as
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
                        "font-display text-stat-lg leading-9 font-black tracking-tight",
                        participationExactTitle && "cursor-help",
                    )}
                    title={participationExactTitle}
                >
                    {participationDisplay} %
                </p>
            </div>
            <div className="w-full min-w-0 flex-1">
                <p className="text-md mb-3 font-semibold">
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
                <div className="text-detail mb-3 flex items-center gap-2 font-semibold">
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
                                className="text-muted-foreground text-2xs absolute -top-5 -translate-x-1/2 font-semibold whitespace-nowrap"
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
