import type { UnitResponseDto } from "@/api/generated/model";

export interface OwnerHolding {
    unit: UnitResponseDto;
    /** Everyone else who holds a part of the unit today. */
    coOwners: string[];
}

/**
 * The units an owner holds today, out of the unit register.
 *
 * Matched by owner id, never by name: the katastr import produces namesakes,
 * and a name match would hand each of them the other's flats.
 */
export function ownerHoldings(
    units: UnitResponseDto[],
    ownerId: string,
): OwnerHolding[] {
    return units
        .filter((unit) => unit.ownerRefs.some((ref) => ref.id === ownerId))
        .map((unit) => ({
            unit,
            coOwners: unit.ownerRefs
                .filter((ref) => ref.id !== ownerId)
                .map((ref) => ref.displayName),
        }))
        .sort((a, b) =>
            a.unit.unitNo.localeCompare(b.unit.unitNo, "cs", {
                numeric: true,
            }),
        );
}

export type HoldingsState =
    | { kind: "loading" }
    | { kind: "error" }
    | { kind: "list"; holdings: OwnerHolding[] };

/**
 * What the Holdings section can honestly say. A register that has not
 * arrived is not an empty one: "holds no unit" under a header that counts
 * three would be a false statement, and one that stays if the request fails.
 */
export function holdingsState(
    units: UnitResponseDto[] | undefined,
    status: { isLoading: boolean; isError: boolean },
    ownerId: string,
): HoldingsState {
    if (units) return { kind: "list", holdings: ownerHoldings(units, ownerId) };
    if (status.isError) return { kind: "error" };
    return { kind: "loading" };
}
