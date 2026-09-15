import {
    type SetVoteRulesetResponseDto,
    type VoteResultsResponseDto,
    type VoteTurnoutResponseDto,
} from "@/api/generated/model";
import { fractionToTrimmedPercentString } from "@hoa-mngr/ui";

/**
 * The participation fields shared by the closed-vote result and the live
 * turnout response, so one implementation serves both. Structural on
 * purpose — the two DTOs are generated separately and neither should have
 * to know about the other.
 */
export type ParticipationSource = Pick<
    VoteResultsResponseDto & VoteTurnoutResponseDto,
    "participationUnitCount" | "totalVotesUnitCount" | "participationPercent"
>;

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
 * Shared by ParticipationBanner, VerdictCard (for the reasonNoQuorum
 * sentence's `turnout`) and the live results turnout card, so every surface
 * reports the exact same number for "how many took part" — quorum is
 * vote-level (spec section 3), so there is only
 * ever one participation figure for the whole vote. Quorum only exists for
 * ASSEMBLY_RECORD votes — `ruleset.quorum` is `null` for PER_ROLLAM, in
 * which case the weight axis is used (matching the weight-based
 * `participationPercent` the server always computes).
 */
export function computeParticipationStats(
    source: ParticipationSource,
    ruleset: SetVoteRulesetResponseDto | null | undefined,
): ParticipationStats {
    const isUnitCount = ruleset?.quorum?.measure === "UNIT_COUNT";
    const pct = isUnitCount
        ? source.totalVotesUnitCount > 0
            ? (source.participationUnitCount / source.totalVotesUnitCount) * 100
            : 0
        : Number(source.participationPercent);

    return {
        pct,
        units: source.participationUnitCount,
        total: source.totalVotesUnitCount,
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
