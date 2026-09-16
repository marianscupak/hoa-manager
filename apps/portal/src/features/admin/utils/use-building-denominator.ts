import { useMemo } from "react";

import { useUnitControllerGetUnits } from "@/api/generated/property-units/property-units";

import { mostCommonDenominator } from "./building-denominator";

/**
 * The denominator to offer when someone types a share of the house.
 *
 * Reads the units list the units page already loads, so on that page this
 * costs nothing; the unit detail page pays for one cached query in exchange
 * for the same suggestion. `undefined` until the list arrives, and for a
 * house with no units yet — in both cases the denominator is simply typed
 * out in full.
 */
export function useBuildingDenominator(): number | undefined {
    const { data: units } = useUnitControllerGetUnits();
    return useMemo(() => mostCommonDenominator(units ?? []), [units]);
}
