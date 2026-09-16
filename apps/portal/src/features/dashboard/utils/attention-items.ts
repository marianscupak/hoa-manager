import { formatPercentValue } from "@hoa-mngr/ui";

import type { PropertyOverviewResponseDto } from "@/api/generated/model";

export interface AttentionItem {
    key: "shareDrift" | "unitsWithoutOwner" | "pendingInvites";
    tone: "warning" | "primary";
    to: string;
    labelKey: string;
    labelParams: Record<string, string | number>;
    count: number;
}

export function deriveAttentionItems(
    overview: PropertyOverviewResponseDto,
): AttentionItem[] {
    const items: AttentionItem[] = [];
    const drift = Math.abs(100 - overview.units.buildingShareSum);
    if (drift > 0.005) {
        items.push({
            key: "shareDrift",
            tone: "warning",
            to: "/admin/units",
            labelKey: "dashboard:attention.shareDrift",
            labelParams: {
                sum: formatPercentValue(overview.units.buildingShareSum),
            },
            count: 1,
        });
    }
    if (overview.units.withoutOwnersCount > 0) {
        items.push({
            key: "unitsWithoutOwner",
            tone: "warning",
            to: "/admin/units",
            labelKey: "dashboard:attention.unitsWithoutOwner",
            labelParams: { count: overview.units.withoutOwnersCount },
            count: overview.units.withoutOwnersCount,
        });
    }
    if (overview.invites.pending > 0) {
        items.push({
            key: "pendingInvites",
            tone: "primary",
            to: "/people",
            labelKey: "dashboard:attention.pendingInvites",
            labelParams: { count: overview.invites.pending },
            count: overview.invites.pending,
        });
    }
    return items;
}
