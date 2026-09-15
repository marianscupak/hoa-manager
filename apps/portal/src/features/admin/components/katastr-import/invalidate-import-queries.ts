import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { getAuditControllerGetActivityQueryKey } from "@/api/generated/audit/audit";
import { getOwnerControllerGetOwnersQueryKey } from "@/api/generated/property-owners/property-owners";
import { getUnitControllerGetUnitsQueryKey } from "@/api/generated/property-units/property-units";
import { getPropertyControllerGetOverviewQueryKey } from "@/api/generated/property/property";

/**
 * Exact query keys to invalidate once a katastr import is applied. None of
 * these take arguments the import could have changed, so a single call
 * covers every cached instance:
 *
 * - the owners list and the property overview (the share-sum banner's
 *   source) each have exactly one cached key;
 * - the activity timeline's key is generated with no filter params, and
 *   React Query's partial match compares cached keys by truncating them to
 *   the filter's length — `["/api/audit/activity"]` (length 1) is a prefix
 *   of a filtered cache entry `["/api/audit/activity", {...filters}]`
 *   (length 2) — so this one key reaches every filtered variant too.
 *
 * The units list is deliberately NOT here: see `isUnitScopedQuery` below for
 * why it needs a predicate instead of a plain key.
 */
export function getKatastrImportInvalidationKeys(): QueryKey[] {
    return [
        getOwnerControllerGetOwnersQueryKey(),
        getPropertyControllerGetOverviewQueryKey(),
        getAuditControllerGetActivityQueryKey(),
    ];
}

/**
 * True for any cached query scoped under the units API: the units list
 * itself (`/api/units`), a specific unit's detail (`/api/units/{id}`) or
 * ownership history (`/api/units/{id}/ownership/history`), and the current
 * user's owned units (`/api/units/mine`).
 *
 * A katastr import can create, update, or re-assign the ownership of any
 * unit, but its result only reports counts, never which unit ids changed —
 * so unlike a single-unit edit, there is no id to pass to
 * `getUnitControllerGetUnitDetailQueryKey`. And a plain
 * `invalidateQueries({ queryKey: getUnitControllerGetUnitsQueryKey() })`
 * would not reach those detail caches anyway: React Query's partial match
 * compares each array element positionally, and the whole string
 * "/api/units" is never equal to "/api/units/abc-123" — the id lives
 * inside the string itself, not as a second key element the way the
 * activity timeline's filters do. Matching on the shared URL prefix is the
 * only way to also catch a unit detail page that happens to already be
 * cached.
 */
export function isUnitScopedQuery(queryKey: QueryKey): boolean {
    const root = getUnitControllerGetUnitsQueryKey()[0];
    const first = queryKey[0];
    return (
        typeof first === "string" &&
        (first === root || first.startsWith(`${root}/`))
    );
}

/** Invalidates every cached query a katastr import can change. */
export function invalidateKatastrImportQueries(queryClient: QueryClient): void {
    for (const queryKey of getKatastrImportInvalidationKeys()) {
        void queryClient.invalidateQueries({ queryKey });
    }
    void queryClient.invalidateQueries({
        predicate: (query) => isUnitScopedQuery(query.queryKey),
    });
}
