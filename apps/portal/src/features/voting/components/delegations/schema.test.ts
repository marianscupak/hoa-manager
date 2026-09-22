import { describe, expect, it } from "vitest";

import { adminRecordDelegationSchema } from "./schema";

// `adminRecordDelegationSchema` takes a real i18next `TFunction`; these
// tests only care about which key fired, so the identity function stands in
// for it.
const t = ((key: string) => key) as never;

describe("adminRecordDelegationSchema", () => {
    it("accepts a fromOwnerId grantor (an owner without a user account)", () => {
        const result = adminRecordDelegationSchema(t).safeParse({
            voteId: "v1",
            unitId: "u1",
            fromOwnerId: "owner-accountless-1",
            delegateKey: "owner:o1",
        });

        expect(result.success).toBe(true);
    });

    it("rejects a blank fromOwnerId with the owner error key", () => {
        const result = adminRecordDelegationSchema(t).safeParse({
            voteId: "v1",
            unitId: "u1",
            fromOwnerId: "",
            delegateKey: "owner:o1",
        });

        expect(result.success).toBe(false);
        expect(
            result.error?.issues.some(
                (issue) => issue.message === "delegations.admin.errors.owner",
            ),
        ).toBe(true);
    });

    it("no longer accepts the legacy delegateMembershipId field name", () => {
        const result = adminRecordDelegationSchema(t).safeParse({
            voteId: "v1",
            unitId: "u1",
            fromOwnerId: "owner-accountless-1",
            delegateMembershipId: "m1",
        });

        expect(result.success).toBe(false);
    });
});
