import { describe, expect, it } from "vitest";

import type { UnitResponseDto } from "@/api/generated/model";

import { holdingsState, ownerHoldings } from "./owner-holdings";

const unit = (
    unitNo: string,
    ownerRefs: { id: string; displayName: string }[],
): UnitResponseDto =>
    ({
        id: `u-${unitNo}`,
        tenantId: "t1",
        unitNo,
        buildingShareNumerator: 100,
        buildingShareDenominator: 1000,
        owners: ownerRefs.map((r) => r.displayName),
        ownerRefs,
        mine: false,
        myShareNumerator: null,
        myShareDenominator: null,
        usageCode: "1",
        usageName: "byt",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
    }) as UnitResponseDto;

const jana1 = { id: "o1", displayName: "Jana Nováková" };
const jana2 = { id: "o2", displayName: "Jana Nováková" };
const petr = { id: "o3", displayName: "Petr Svoboda" };

describe("ownerHoldings", () => {
    it("keeps only the units this owner holds, matched by id", () => {
        const units = [
            unit("1", [jana1]),
            unit("2", [jana2]),
            unit("3", [petr]),
        ];

        expect(ownerHoldings(units, "o1").map((h) => h.unit.unitNo)).toEqual([
            "1",
        ]);
        expect(ownerHoldings(units, "o2").map((h) => h.unit.unitNo)).toEqual([
            "2",
        ]);
    });

    it("names the other owners of a unit, excluding this one by id", () => {
        const [holding] = ownerHoldings(
            [unit("1", [jana1, jana2, petr])],
            "o1",
        );

        // The namesake is a different person and must still be listed.
        expect(holding.coOwners).toEqual(["Jana Nováková", "Petr Svoboda"]);
    });

    it("has no co-owners for a sole owner", () => {
        const [holding] = ownerHoldings([unit("1", [petr])], "o3");
        expect(holding.coOwners).toEqual([]);
    });

    it("sorts by unit number the way people read it", () => {
        const units = [
            unit("10", [petr]),
            unit("2", [petr]),
            unit("1", [petr]),
        ];
        expect(ownerHoldings(units, "o3").map((h) => h.unit.unitNo)).toEqual([
            "1",
            "2",
            "10",
        ]);
    });

    it("returns nothing for an owner who holds no unit", () => {
        expect(ownerHoldings([unit("1", [petr])], "o1")).toEqual([]);
    });
});

describe("holdingsState", () => {
    const units = [unit("1", [petr])];

    it("is loading until the register arrives, not empty", () => {
        expect(
            holdingsState(undefined, { isLoading: true, isError: false }, "o3"),
        ).toEqual({ kind: "loading" });
    });

    it("is an error when the register failed and nothing was ever loaded", () => {
        expect(
            holdingsState(undefined, { isLoading: false, isError: true }, "o3"),
        ).toEqual({ kind: "error" });
    });

    it("keeps showing the loaded register when a later refetch fails", () => {
        const state = holdingsState(
            units,
            { isLoading: false, isError: true },
            "o3",
        );
        expect(state.kind).toBe("list");
    });

    it("lists what the owner holds, possibly nothing, once loaded", () => {
        expect(
            holdingsState(units, { isLoading: false, isError: false }, "o1"),
        ).toEqual({ kind: "list", holdings: [] });
    });
});
