export const KATASTR_ERROR_CODES = [
    "NOT_A_KATASTR_DOCUMENT",
    "UNSUPPORTED_DIALECT",
    "DTD_NOT_ALLOWED",
    "MALFORMED_XML",
    "UNKNOWN_SUBJECT_TYPE",
    "PARTIAL_EXTRACT",
    "INCONSISTENT_DUPLICATE_UNIT",
    "SHARE_OUT_OF_RANGE",
    "SHARE_MALFORMED",
    "BUILDING_SHARE_SUM",
    "UNIT_SHARE_SUM",
    "SJM_SHAPE_UNEXPECTED",
    "UNIT_WITHOUT_OWNER",
    "SUBJECT_WITHOUT_ID",
    "SUBJECT_WITHOUT_TYPE",
    "MISSING_DOCUMENT_DATE",
] as const;

export const KATASTR_BLOCKER_CODES = [
    "EFFECTIVE_DATE_TOO_EARLY",
    "TRANSFER_ALREADY_SCHEDULED",
    "AMBIGUOUS_NAME",
    "AMBIGUOUS_ICO",
    "MIXED_ASSOCIATION",
    "UNIT_NO_COLLISION",
    "OWNERSHIP_PLAN_REJECTED",
] as const;

export const KATASTR_WARNING_CODES = [
    "IMPLIED_FULL_SHARE",
    "NAME_MATCH",
    "KIND_MISMATCH",
] as const;

export type KatastrCoded = { code: string } & Record<string, unknown>;

/**
 * `katastr:errors.PARTIAL_EXTRACT` and friends. Values from the API are
 * interpolation variables, so a new field on a code needs no portal change.
 */
export function messageKeyFor(
    kind: "errors" | "blockers" | "warnings",
    code: string,
): string {
    return `katastr:${kind}.${code}`;
}

export interface KatastrImportCounts {
    unitsCreated: number;
    unitsUpdated: number;
}

/**
 * True when a confirmed import would change nothing. Shared so the
 * preview's own "nothing to do" note and the confirm flow's disable gate
 * (Task 10) read the same predicate rather than each re-deriving it and
 * silently drifting apart.
 */
export function hasNothingToDo(counts: KatastrImportCounts): boolean {
    return counts.unitsCreated + counts.unitsUpdated === 0;
}
