import { describe, expect, it } from "vitest";

import {
    accountGuards,
    addressName,
    isLastActiveAdmin,
    personStatus,
} from "./person-status";

describe("personStatus", () => {
    it("reads the membership status when there is a membership", () => {
        expect(
            personStatus({
                membershipId: "m1",
                status: "ACTIVE",
                inviteStatus: null,
            }),
        ).toBe("active");
        expect(
            personStatus({
                membershipId: "m1",
                status: "INVITED",
                inviteStatus: null,
            }),
        ).toBe("invited");
        expect(
            personStatus({
                membershipId: "m1",
                status: "SUSPENDED",
                inviteStatus: null,
            }),
        ).toBe("suspended");
    });

    it("lets the membership win over a stale pending invitation", () => {
        expect(
            personStatus({
                membershipId: "m1",
                status: "ACTIVE",
                inviteStatus: "pending",
            }),
        ).toBe("active");
    });

    it("shows a pending invitation for an owner without an account", () => {
        expect(
            personStatus({
                membershipId: null,
                status: null,
                inviteStatus: "pending",
            }),
        ).toBe("invitationSent");
    });

    it("treats an expired invitation as no account", () => {
        expect(
            personStatus({
                membershipId: null,
                status: null,
                inviteStatus: "expired",
            }),
        ).toBe("noAccount");
    });

    it("reads no account when there is neither membership nor invitation", () => {
        expect(
            personStatus({
                membershipId: null,
                status: null,
                inviteStatus: null,
            }),
        ).toBe("noAccount");
    });
});

describe("isLastActiveAdmin", () => {
    it("is true with exactly one active admin", () => {
        expect(
            isLastActiveAdmin([
                { role: "ADMIN", status: "ACTIVE" },
                { role: "BOARD_MEMBER", status: "ACTIVE" },
            ]),
        ).toBe(true);
    });

    it("does not count a suspended admin", () => {
        expect(
            isLastActiveAdmin([
                { role: "ADMIN", status: "ACTIVE" },
                { role: "ADMIN", status: "SUSPENDED" },
            ]),
        ).toBe(true);
    });

    it("is false with two active admins", () => {
        expect(
            isLastActiveAdmin([
                { role: "ADMIN", status: "ACTIVE" },
                { role: "ADMIN", status: "ACTIVE" },
            ]),
        ).toBe(false);
    });
});

describe("accountGuards", () => {
    const admin = {
        isAdmin: true,
        isLastAdmin: false,
        currentMembershipId: "me",
    };

    it("lets an admin suspend another active member", () => {
        expect(
            accountGuards(
                { membershipId: "m1", role: "UNIT_OWNER", status: "ACTIVE" },
                admin,
            ),
        ).toEqual({
            lastAdminGuard: false,
            isSelf: false,
            canSuspend: true,
            canRestore: false,
        });
    });

    it("never offers suspending yourself", () => {
        const guards = accountGuards(
            { membershipId: "me", role: "ADMIN", status: "ACTIVE" },
            admin,
        );
        expect(guards.isSelf).toBe(true);
        expect(guards.canSuspend).toBe(false);
    });

    it("guards the last active admin against demotion and suspension", () => {
        const guards = accountGuards(
            { membershipId: "m1", role: "ADMIN", status: "ACTIVE" },
            { ...admin, isLastAdmin: true },
        );
        expect(guards.lastAdminGuard).toBe(true);
        expect(guards.canSuspend).toBe(false);
    });

    it("does not guard a suspended admin even when one active admin is left", () => {
        const guards = accountGuards(
            { membershipId: "m1", role: "ADMIN", status: "SUSPENDED" },
            { ...admin, isLastAdmin: true },
        );
        expect(guards.lastAdminGuard).toBe(false);
        expect(guards.canRestore).toBe(true);
    });

    it("gives a board member neither suspend nor restore", () => {
        const board = { ...admin, isAdmin: false };
        expect(
            accountGuards(
                { membershipId: "m1", role: "UNIT_OWNER", status: "ACTIVE" },
                board,
            ).canSuspend,
        ).toBe(false);
        expect(
            accountGuards(
                { membershipId: "m1", role: "UNIT_OWNER", status: "SUSPENDED" },
                board,
            ).canRestore,
        ).toBe(false);
    });
});

describe("addressName", () => {
    it("uses a person's first name", () => {
        expect(addressName({ displayName: "Jana Tichá", kind: "PERSON" })).toBe(
            "Jana",
        );
    });

    it("keeps the whole name of a legal entity or an association", () => {
        expect(
            addressName({
                displayName: "B 2000 REAL a.s.",
                kind: "LEGAL_ENTITY",
            }),
        ).toBe("B 2000 REAL a.s.");
        expect(
            addressName({ displayName: "Město Příbram", kind: "ASSOCIATION" }),
        ).toBe("Město Příbram");
    });
});
