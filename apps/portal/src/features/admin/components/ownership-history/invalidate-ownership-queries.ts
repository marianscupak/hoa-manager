import type { QueryClient, QueryKey } from "@tanstack/react-query";

import {
    getUnitControllerGetOwnershipHistoryQueryKey,
    getUnitControllerGetUnitDetailQueryKey,
    getUnitControllerGetUnitsQueryKey,
} from "@/api/generated/property-units/property-units";

/**
 * Every cached query a change to one unit's ownership can falsify: that
 * unit's history and detail, and the register list, which prints the
 * current owner of every unit.
 *
 * This exists as one list because each of the three dialogs that edit
 * ownership — replace, cancel a scheduled transfer, move a period's bounds
 * — used to spell it out for itself, and the period dialog's copy was
 * missing the register list. It leaned on the detail page's `onSuccess`
 * refetch instead, which only reaches what that page has mounted, so
 * /units went on showing the previous owner until a reload.
 *
 * The keys are named individually rather than matched on the shared
 * "/api/units" prefix: React Query compares key elements positionally, and
 * the unit id lives inside the string, so "/api/units" is not a partial
 * match for "/api/units/{id}". (A katastr import, which can touch any unit
 * and reports no ids, needs the prefix predicate instead — see
 * `invalidate-import-queries.ts`.)
 */
export function getUnitOwnershipInvalidationKeys(unitId: string): QueryKey[] {
    return [
        getUnitControllerGetOwnershipHistoryQueryKey(unitId),
        getUnitControllerGetUnitDetailQueryKey(unitId),
        getUnitControllerGetUnitsQueryKey(),
    ];
}

/** Invalidates every cached query an edit to this unit's ownership changes. */
export function invalidateUnitOwnershipQueries(
    queryClient: QueryClient,
    unitId: string,
): void {
    for (const queryKey of getUnitOwnershipInvalidationKeys(unitId)) {
        void queryClient.invalidateQueries({ queryKey });
    }
}
