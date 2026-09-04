import type { UnitOwnershipResponseDto } from "@/api/generated/model";

import type { ReplaceOwnershipValues } from "./schema";

type OwnershipRow = ReplaceOwnershipValues["ownerships"][number];

/** A row appended with "Add owner": the share stays blank on purpose so the
 *  live sum hint tells the user exactly what is still missing. */
export const emptyRow = (): OwnershipRow => ({
    partyType: "SOLE",
    share: null,
    memberOwnerIds: [""],
});

/** Rows the editor opens with. A unit that has no owners yet starts as one
 *  sole party holding the whole unit, which is by far the common case. */
export function initialRows(
    current: UnitOwnershipResponseDto[] | undefined,
): OwnershipRow[] {
    if (!current || current.length === 0) {
        return [{ ...emptyRow(), share: { num: 1, den: 1 } }];
    }
    return current.map((o) => ({
        partyType: o.partyType,
        share: { num: o.shareNumerator, den: o.shareDenominator },
        memberOwnerIds: o.members.map((m) => m.ownerId),
    }));
}
