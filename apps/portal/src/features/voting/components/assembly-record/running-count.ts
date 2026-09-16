import type { TFunction } from "i18next";

import { formatPercent } from "@hoa-mngr/ui";

import { sharePercent } from "@/features/units/utils/shares";

export interface RunningCountFigure {
    /** The metric that decides the vote. */
    primary: string;
    /** The other one, or null when it is the same number. */
    secondary: string | null;
}

/**
 * How one option's running total reads.
 *
 * The handoff put unit counts first and left the weighted percentages to the
 * review screen. That is wrong for the default ruleset: `weightBasis` is
 * `UNIT_SHARE`, so the outcome is decided by share, and "9 yes / 2 no" in unit
 * counts can be a minority whenever those two units are large. A running count
 * that does not track the deciding metric cannot do the job it is there for.
 *
 * The percentage is of all votes in the building, not of the ballots entered
 * so far. The final basis is votes cast, but that set grows with every entry,
 * so a percentage against it would move both up and down while the board
 * types. A fixed denominator only ever rises.
 */
export function runningCountFigure(
    option: { weight: { num: string; den: string }; unitCount: number },
    allVotesWeight: { num: string; den: string },
    weightBasis: "UNIT_SHARE" | "ONE_UNIT_ONE_VOTE",
    t: TFunction<"voting">,
): RunningCountFigure {
    // Unprefixed: the typed plural keys are resolved against the hook's
    // default namespace, the way `liveResults.tally.units` already is.
    const units = t("assemblyRecord.tally.units", {
        count: option.unitCount,
    });

    if (weightBasis === "ONE_UNIT_ONE_VOTE") {
        // Units are the deciding metric here, so there is no second number.
        return { primary: units, secondary: null };
    }

    const optionPercent = sharePercent(
        Number(option.weight.num),
        Number(option.weight.den),
    );
    const allPercent =
        sharePercent(Number(allVotesWeight.num), Number(allVotesWeight.den)) ||
        1;

    return {
        primary: formatPercent((optionPercent / allPercent) * 100),
        secondary: units,
    };
}
