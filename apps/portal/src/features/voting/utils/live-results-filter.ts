import { matchesSearch } from "@hoa-mngr/ui";

import type { VoteParticipationUnitDto } from "@/api/generated/model";

/** `DataTable` requires rows to carry an `id: string`; the participation DTO
 *  only has `unitId`, so callers map it onto `id` before handing rows in. */
export type LiveResultsRow = VoteParticipationUnitDto & { id: string };

export type LiveResultsFilter = "all" | "voted" | "notVoted";

export interface LiveResultsQuery {
    search: string;
    filter: LiveResultsFilter;
}

/**
 * Pill and search combine with AND. "Not voted" deliberately includes
 * ineligible and needs-delegation units: from the reader's point of view
 * the question is "whose ballot is still missing", not "who was allowed to
 * cast one".
 *
 * Owner payloads carry no `ownerNames`, so a name search simply finds
 * nothing for them — the filter never reaches for another field to match.
 */
export function filterUnits(
    units: LiveResultsRow[],
    { search, filter }: LiveResultsQuery,
): LiveResultsRow[] {
    return units.filter((unit) => {
        if (filter === "voted" && unit.status !== "VOTED") return false;
        if (filter === "notVoted" && unit.status === "VOTED") return false;
        if (!search.trim()) return true;
        return (
            matchesSearch(unit.unitNo, search) ||
            (unit.ownerNames ?? []).some((name) => matchesSearch(name, search))
        );
    });
}
