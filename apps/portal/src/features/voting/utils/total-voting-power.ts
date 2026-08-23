import type { TFunction } from "i18next";

import { trimTrailingZeros } from "@hoa-mngr/ui";

// Callers must pass a "voting"-namespace-scoped t (e.g. useTranslation("voting").t);
// a default-namespace TFunction won't type-check the "detail.statusSidebar.*"
// key used below.

export interface TotalVotingPower {
    /** Decimal string, 4 places — see TotalVotingPowerDto. */
    value: string;
    /** Decimal string, 4 places — see TotalVotingPowerDto. */
    maximum: string;
}

/**
 * `value`/`maximum` are exact-rational sums rendered server-side as 4-place
 * decimal strings (never floats) — see TotalVotingPowerDto. That rounding
 * already happened before this ever reaches the client, so re-deriving an
 * exact BigInt fraction from the two strings would recover nothing; a plain
 * float division for the UNIT_SHARE percent below is proportionate.
 *
 * `maximum` is always the tenant's total *building share* (getTenantTotalShare,
 * API-side) — it does not vary with the vote's weightBasis. `value` is the
 * member's ready weight in whatever basis *this* vote actually uses:
 *
 * - UNIT_SHARE: each unit's weight is its building-share fraction, so
 *   `value` is a building-share sum too — directly comparable to `maximum`,
 *   and `value / maximum` is a real percent of the building.
 * - ONE_UNIT_ONE_VOTE: each unit's weight is a flat `Rational.one()` (a raw
 *   vote count, not a normalized `1/N` share) — not comparable to a
 *   building-share `maximum` at all. A magnitude check (e.g. "is value >
 *   maximum?") does not reliably catch this: a member with exactly one
 *   ready unit has `value === maximum === "1.0000"` whenever the building's
 *   shares happen to sum to 1/1 (which open-vote.handler.ts requires before
 *   a vote can even open), so the common single-unit case would silently
 *   compute a confidently wrong "100 %". `weightBasis` is the only reliable
 *   discriminator, so this always branches on it explicitly and never on
 *   the numbers' relative size.
 *
 * `weightBasis` is `undefined` when the vote has no vote-level ruleset row
 * yet — this genuinely happens: VoterStatusSidebar renders for DRAFT votes
 * too (vote-detail-page.tsx has no status gate around it), and a DRAFT vote
 * can exist before its "rules" wizard step has ever been saved. This isn't
 * merely a defensive fallback: the API's own vote-detail query
 * (drizzle-vote-read.repository.ts's findDetailById) and its voter-status
 * preview path (getWeightBasis) read the *same* vote-level `voteRulesets`
 * row — no row means `vote.ruleset` is null on the client AND
 * `getWeightBasis` used its own hardcoded `?? VoteWeightBasis.UNIT_SHARE`
 * default to compute `value` server-side. So `undefined` here always means
 * the server computed `value` as a UNIT_SHARE building-share sum, and the
 * UNIT_SHARE percent branch is the verified-correct choice, not a guess.
 * Once a vote is OPEN/CLOSED the ruleset is guaranteed set (scheduling
 * requires one), so this branch only ever fires pre-schedule.
 */
export function formatTotalVotingPower(
    power: TotalVotingPower,
    weightBasis: "UNIT_SHARE" | "ONE_UNIT_ONE_VOTE" | undefined,
    t: TFunction<"voting">,
): string {
    if (weightBasis === "ONE_UNIT_ONE_VOTE") {
        const count = Math.round(Number(power.value));
        return t("detail.statusSidebar.totalPowerVotes", { count });
    }

    const maximum = Number(power.maximum);
    if (maximum <= 0) return "0 %";
    const percent = (Number(power.value) / maximum) * 100;
    return `${trimTrailingZeros(percent.toFixed(2))} %`;
}
