import { zodResolver } from "@hookform/resolvers/zod";
import { describe, expect, it } from "vitest";

import { replaceOwnershipSchema } from "./schema";

// `replaceOwnershipSchema` takes a real i18next `TFunction`; these tests only
// care about which key fired, so the identity function stands in for it.
const t = ((key: string) => key) as never;

describe("replaceOwnershipSchema", () => {
    it("accepts three sole owners splitting a unit exactly into thirds", () => {
        const result = replaceOwnershipSchema(t).safeParse({
            ownerships: [
                {
                    partyType: "SOLE",
                    share: { num: 1, den: 3 },
                    memberOwnerIds: ["p1"],
                },
                {
                    partyType: "SOLE",
                    share: { num: 1, den: 3 },
                    memberOwnerIds: ["p2"],
                },
                {
                    partyType: "SOLE",
                    share: { num: 1, den: 3 },
                    memberOwnerIds: ["p3"],
                },
            ],
        });

        expect(result.success).toBe(true);
    });

    it("accepts a single SJM party holding the whole unit", () => {
        const result = replaceOwnershipSchema(t).safeParse({
            ownerships: [
                {
                    partyType: "SJM",
                    share: { num: 1, den: 1 },
                    memberOwnerIds: ["p1", "p2"],
                },
            ],
        });

        expect(result.success).toBe(true);
    });

    it("attaches the SJM duplicate-member error directly onto that row's memberOwnerIds field", async () => {
        // Regression test: field-item.tsx renders this exact resolver shape.
        // The per-party refine's `path: ["memberOwnerIds"]` lands at
        // `ownerships.<index>.memberOwnerIds` directly (no `.root` — that
        // wrapping only applies to the top-level `ownerships` field array
        // itself), which is easy to get wrong and, if unread, leaves the
        // dialog with no visible feedback at all when Save is blocked.
        const resolver = zodResolver(replaceOwnershipSchema(t));

        const result = await resolver(
            {
                ownerships: [
                    {
                        partyType: "SJM",
                        share: { num: 1, den: 1 },
                        memberOwnerIds: ["p1", "p1"],
                    },
                ],
            },
            {},
            { fields: {}, shouldUseNativeValidation: false } as never,
        );

        expect(result.errors.ownerships?.[0]?.memberOwnerIds?.message).toBe(
            "units.ownershipEditor.membersError",
        );
    });

    it("rejects a SOLE party with two members", () => {
        const result = replaceOwnershipSchema(t).safeParse({
            ownerships: [
                {
                    partyType: "SOLE",
                    share: { num: 1, den: 1 },
                    memberOwnerIds: ["p1", "p2"],
                },
            ],
        });

        expect(result.success).toBe(false);
    });

    it("rejects a plan whose shares do not sum to exactly 1/1", () => {
        const result = replaceOwnershipSchema(t).safeParse({
            ownerships: [
                {
                    partyType: "SOLE",
                    share: { num: 1, den: 2 },
                    memberOwnerIds: ["p1"],
                },
                {
                    partyType: "SOLE",
                    share: { num: 1, den: 3 },
                    memberOwnerIds: ["p2"],
                },
            ],
        });

        expect(result.success).toBe(false);
        expect(
            result.error?.issues.some(
                (issue) => issue.message === "units.ownershipEditor.sumError",
            ),
        ).toBe(true);
    });

    it("rejects the same owner appearing in two different parties", () => {
        const result = replaceOwnershipSchema(t).safeParse({
            ownerships: [
                {
                    partyType: "SOLE",
                    share: { num: 1, den: 2 },
                    memberOwnerIds: ["p1"],
                },
                {
                    partyType: "SOLE",
                    share: { num: 1, den: 2 },
                    memberOwnerIds: ["p1"],
                },
            ],
        });

        expect(result.success).toBe(false);
        expect(
            result.error?.issues.some(
                (issue) =>
                    issue.message === "units.ownershipEditor.duplicateError",
            ),
        ).toBe(true);
    });

    it("localizes the blank-member-slot error instead of falling back to zod's raw default", async () => {
        // Regression test: `memberOwnerIds`' inner `z.string().min(1)` used to
        // carry no custom message, so an unpicked owner slot rendered zod's
        // raw untranslated default text via FormMessage's `t(error.message)`
        // pass-through. This is a per-element error (unlike the whole-array
        // `membersError` refine above), so it lands indexed at
        // `memberOwnerIds[0]` — exactly the path each member `FormSelect`
        // already reads via its own built-in `FormMessage`.
        const resolver = zodResolver(replaceOwnershipSchema(t));

        const result = await resolver(
            {
                ownerships: [
                    {
                        partyType: "SOLE",
                        share: { num: 1, den: 1 },
                        memberOwnerIds: [""],
                    },
                ],
            },
            {},
            { fields: {}, shouldUseNativeValidation: false } as never,
        );

        expect(
            result.errors.ownerships?.[0]?.memberOwnerIds?.[0]?.message,
        ).toBe("units.ownershipEditor.ownerRequiredError");
    });

    it("reports a per-row error for an unfilled (null) share without throwing", async () => {
        // Regression test for the nullable-share guard in the outer sum
        // refine: sumFractions() would throw on a null entry if it weren't
        // filtered out first.
        const resolver = zodResolver(replaceOwnershipSchema(t));

        const result = await resolver(
            {
                ownerships: [
                    {
                        partyType: "SOLE",
                        share: null,
                        memberOwnerIds: ["p1"],
                    },
                ],
            },
            {},
            { fields: {}, shouldUseNativeValidation: false } as never,
        );

        expect(result.errors.ownerships?.[0]?.share?.message).toBe(
            "units.ownershipEditor.invalidShareError",
        );
        // The sum refine must not also fire a confusing second error for a
        // row that's simply incomplete.
        expect(result.errors.ownerships?.root).toBeUndefined();
    });
});
