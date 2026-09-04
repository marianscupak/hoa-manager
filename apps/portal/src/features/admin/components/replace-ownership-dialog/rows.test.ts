import { describe, expect, it } from "vitest";

import type { UnitOwnershipResponseDto } from "@/api/generated/model";

import { emptyRow, initialRows } from "./rows";

describe("initialRows", () => {
    it("starts a unit without owners with a single sole party holding 1/1", () => {
        expect(initialRows(undefined)).toEqual([
            {
                partyType: "SOLE",
                share: { num: 1, den: 1 },
                memberOwnerIds: [""],
            },
        ]);
        expect(initialRows([])).toEqual([
            {
                partyType: "SOLE",
                share: { num: 1, den: 1 },
                memberOwnerIds: [""],
            },
        ]);
    });

    it("mirrors the current parties when the unit already has owners", () => {
        const current: UnitOwnershipResponseDto[] = [
            {
                id: "own-1",
                partyType: "SJM",
                shareNumerator: 1,
                shareDenominator: 1,
                shareDecimal: "1.0000",
                members: [
                    { ownerId: "p1", displayName: "Jana", kind: "PERSON" },
                    { ownerId: "p2", displayName: "Petr", kind: "PERSON" },
                ],
            },
        ];
        expect(initialRows(current)).toEqual([
            {
                partyType: "SJM",
                share: { num: 1, den: 1 },
                memberOwnerIds: ["p1", "p2"],
            },
        ]);
    });
});

describe("emptyRow", () => {
    it("leaves the share blank so the sum hint says what is still missing", () => {
        expect(emptyRow()).toEqual({
            partyType: "SOLE",
            share: null,
            memberOwnerIds: [""],
        });
    });
});
