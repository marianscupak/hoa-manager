import { describe, expect, it } from "vitest";

import type { PropertyOverviewResponseDto } from "@/api/generated/model";

import { deriveAttentionItems } from "./attention-items";

function buildOverview(overrides: {
    buildingShareSum?: number;
    withoutOwnersCount?: number;
    pending?: number;
}): PropertyOverviewResponseDto {
    return {
        units: {
            total: 10,
            withoutOwnersCount: overrides.withoutOwnersCount ?? 0,
            buildingShareSum: overrides.buildingShareSum ?? 100,
        },
        owners: { active: 10 },
        invites: {
            pending: overrides.pending ?? 0,
            oldestPendingCreatedAt: null,
        },
    };
}

describe("deriveAttentionItems", () => {
    it("returns no items for a perfect overview", () => {
        const items = deriveAttentionItems(buildOverview({}));

        expect(items).toEqual([]);
    });

    it("returns a shareDrift item with the formatted sum when building shares don't add up to 100", () => {
        const items = deriveAttentionItems(
            buildOverview({ buildingShareSum: 99.85 }),
        );

        expect(items).toHaveLength(1);
        expect(items[0].key).toBe("shareDrift");
        expect(items[0].labelParams.sum).toBe("99.85");
    });

    it("returns unitsWithoutOwner and pendingInvites items with correct counts and targets", () => {
        const items = deriveAttentionItems(
            buildOverview({ withoutOwnersCount: 3, pending: 2 }),
        );

        expect(items).toHaveLength(2);

        const unitsItem = items.find(
            (item) => item.key === "unitsWithoutOwner",
        );
        const invitesItem = items.find((item) => item.key === "pendingInvites");

        expect(unitsItem?.count).toBe(3);
        expect(unitsItem?.to).toBe("/admin/units");
        expect(invitesItem?.count).toBe(2);
        expect(invitesItem?.to).toBe("/people");
    });
});
