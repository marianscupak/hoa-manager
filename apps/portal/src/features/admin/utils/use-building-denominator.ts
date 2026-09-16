import { useMemo } from "react";

import { useUnitControllerGetUnits } from "@/api/generated/property-units/property-units";

import { mostCommonDenominator } from "./building-denominator";

/**
 * The denominator to offer when someone types a share of the house.
 *
 * `enabled` gates the fetch, because the callers are dialogs that stay
 * mounted while closed: without it, opening any unit's detail page would pull
 * the whole units list down for a placeholder nobody is looking at. On the
 * units page the query is already in the cache, so opening the dialog there
 * costs nothing.
 *
 * `undefined` until the list arrives, and for a house with no units yet — in
 * both cases the denominator is simply typed out in full.
 */
export function useBuildingDenominator(enabled = true): number | undefined {
    const { data: units } = useUnitControllerGetUnits({ query: { enabled } });
    return useMemo(() => mostCommonDenominator(units ?? []), [units]);
}
