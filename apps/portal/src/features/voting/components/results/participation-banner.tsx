import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    SetVoteRulesetResponseDtoQuorumMeasure,
    type SetVoteRulesetResponseDto,
    type VoteResultsResponseDto,
} from "@/api/generated/model";
import { Card } from "@hoa-mngr/ui";

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
 * ever one participation figure for the whole vote.
 */
export function computeParticipationStats(
    results: VoteResultsResponseDto,
    ruleset: SetVoteRulesetResponseDto | null | undefined,
): ParticipationStats {
    const isUnitCount =
        ruleset?.quorumMeasure ===
        SetVoteRulesetResponseDtoQuorumMeasure.UNIT_COUNT;
    const numerator = isUnitCount
        ? results.participationUnitCount
        : results.participationWeight;
    const denominator = isUnitCount
        ? results.denominatorUnitCount
        : results.denominatorWeight;

    return {
        pct: denominator > 0 ? (numerator / denominator) * 100 : 0,
        units: results.participationUnitCount,
        total: results.denominatorUnitCount,
        isUnitCount,
    };
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
    const threshold = Math.min(ruleset?.quorumThreshold ?? 50, 100);

    const [animated, setAnimated] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setAnimated(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <Card className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
            <div className="shrink-0">
                <p className="font-display text-[32px] leading-9 font-black tracking-tight">
                    {pct.toFixed(1)} %
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
                            pct: pct.toFixed(1),
                            units,
                            total,
                        },
                    )}
                </p>
                <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold">
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            results.quorumMet ? "bg-success" : "bg-warning"
                        }`}
                    />
                    <span>
                        {t(
                            results.quorumMet
                                ? "resultsV2.quorumMetLine"
                                : "resultsV2.quorumNotMetLine",
                            { threshold },
                        )}
                    </span>
                </div>
                <div className="bg-muted relative mt-5 h-3.5 rounded-full">
                    <div
                        className="bg-primary h-3.5 rounded-full motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                        style={{
                            width: `${animated ? Math.min(pct, 100) : 0}%`,
                        }}
                    />
                    <div
                        className="bg-foreground/40 absolute top-0 h-full w-0.5 rounded-full"
                        style={{ left: `${threshold}%` }}
                    />
                    <span
                        className="text-muted-foreground absolute -top-5 -translate-x-1/2 text-[10.5px] font-semibold whitespace-nowrap"
                        style={{ left: `${threshold}%` }}
                    >
                        {threshold} %
                    </span>
                </div>
            </div>
        </Card>
    );
}
