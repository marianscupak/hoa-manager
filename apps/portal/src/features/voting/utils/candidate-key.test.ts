import { describe, expect, it } from "vitest";

import { candidateKey, consentTargetFromKey } from "./candidate-key";

describe("candidateKey", () => {
    it("prefers the owner identity when the person owns in the tenant", () => {
        expect(candidateKey({ ownerId: "o1", membershipId: "m1" })).toBe(
            "owner:o1",
        );
    });

    it("falls back to the membership for a member who owns nothing", () => {
        expect(candidateKey({ ownerId: null, membershipId: "m1" })).toBe(
            "member:m1",
        );
    });
});

describe("consentTargetFromKey", () => {
    it("maps an owner key to toOwnerId only", () => {
        expect(consentTargetFromKey("owner:o1")).toEqual({ toOwnerId: "o1" });
    });

    it("maps a member key to toMembershipId only", () => {
        expect(consentTargetFromKey("member:m1")).toEqual({
            toMembershipId: "m1",
        });
    });

    it("round-trips through candidateKey", () => {
        const c = { ownerId: "o1", membershipId: null };
        expect(consentTargetFromKey(candidateKey(c))).toEqual({
            toOwnerId: "o1",
        });
    });
});
