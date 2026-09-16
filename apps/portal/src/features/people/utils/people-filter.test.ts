import { describe, expect, it } from "vitest";

import type { PersonResponseDto } from "@/api/generated/model";

import { filterPeople } from "./people-filter";

const person = (over: Partial<PersonResponseDto>): PersonResponseDto =>
    ({
        key: "owner:o1",
        source: "OWNER",
        displayName: "Jana",
        email: null,
        ownerId: "o1",
        kind: "PERSON",
        ico: null,
        unitCount: 0,
        sharePercent: "0.00",
        hasOwnershipRecords: false,
        membershipId: null,
        userId: null,
        role: null,
        status: null,
        joinedAt: null,
        inviteStatus: null,
        inviteCreatedAt: null,
        suggestedCounterpartKey: null,
        ...over,
    }) as PersonResponseDto;

const owner = person({ key: "owner:o1", unitCount: 2 });
const registeredOnly = person({ key: "owner:o2", unitCount: 0 });
const boardMember = person({
    key: "member:m9",
    source: "MEMBER",
    ownerId: null,
    membershipId: "m9",
    role: "BOARD_MEMBER",
    status: "ACTIVE",
});
const deactivated = person({
    key: "member:m8",
    source: "MEMBER",
    ownerId: null,
    membershipId: "m8",
    role: "UNIT_OWNER",
    status: "INACTIVE",
});

const keys = (list: PersonResponseDto[]) => list.map((p) => p.key);

describe("filterPeople", () => {
    const all = [owner, registeredOnly, boardMember, deactivated];

    it("counts as an owner only someone who holds a unit now", () => {
        // An owner record created but never attached to a unit owns nothing,
        // whatever table it came from.
        expect(keys(filterPeople(all, "owners"))).toEqual(["owner:o1"]);
    });

    it("counts as having access anyone with an account, active or not", () => {
        // A deactivated member still has one, and finding them is the point.
        expect(keys(filterPeople(all, "withAccess"))).toEqual([
            "member:m9",
            "member:m8",
        ]);
    });

    it("lists who still needs inviting", () => {
        expect(keys(filterPeople(all, "withoutAccount"))).toEqual([
            "owner:o1",
            "owner:o2",
        ]);
    });

    it("returns everyone unchanged for the default filter", () => {
        expect(filterPeople(all, "all")).toBe(all);
    });
});
