import type { AssemblyRecordResponseDto } from "@/api/generated/model";

export type AssemblyUnit = AssemblyRecordResponseDto["units"][number];

export type RosterFilter = "all" | "todo" | "present" | "absent";

/**
 * What the roster row shows for a unit.
 *
 * `toEnter` is the one that matters: a present unit without a full set of
 * answers is what the publish gate blocks on, and it has to be told apart both
 * from `absent` (the board decided) and from `unset` (the board has not got
 * there yet).
 */
export type RosterState =
    | "complete"
    | "toEnter"
    | "absent"
    | "ineligible"
    | "unset";

export function rosterState(
    unit: AssemblyUnit,
    questionCount: number,
): RosterState {
    // Ineligibility outranks attendance: such a unit cannot be marked present
    // at all, so its attendance value is never meaningful.
    if (unit.eligibility === "INELIGIBLE") return "ineligible";
    if (unit.attendance === "ABSENT") return "absent";
    if (unit.attendance === null) return "unset";
    return unit.answers.length >= questionCount ? "complete" : "toEnter";
}

export function filterRoster(
    units: AssemblyUnit[],
    questionCount: number,
    filter: RosterFilter,
    search: string,
): AssemblyUnit[] {
    const needle = search.trim().toLowerCase();

    return units.filter((unit) => {
        if (needle) {
            const haystack = [
                unit.unitNo,
                ...unit.owners.map((o) => o.displayName),
            ]
                .join(" ")
                .toLowerCase();
            if (!haystack.includes(needle)) return false;
        }

        switch (filter) {
            case "todo":
                return rosterState(unit, questionCount) === "toEnter";
            case "present":
                return unit.attendance === "PRESENT";
            case "absent":
                return unit.attendance === "ABSENT";
            default:
                return true;
        }
    });
}
