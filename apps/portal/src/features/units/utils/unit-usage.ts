import type { TFunction } from "i18next";

import { capitalizeFirst } from "@/features/admin/components/units-table/capitalize-first";

/**
 * The label a unit's usage shows under, or null when the cadastre gave none.
 *
 * i18next returns the key itself when it is missing, which is the signal to
 * fall back to the cadastre's own Czech wording (the sample extract only
 * carries codes 1 and 5).
 */
export function unitUsageLabel(
    t: TFunction<["common", "admin"]>,
    usageCode: string | null,
    usageName: string | null,
): string | null {
    if (!usageCode && !usageName) return null;
    const key = `admin:units.table.usage_${usageCode}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translated = t(key as any) as string;
    const label = translated === key ? usageName ?? "" : translated;
    return label ? capitalizeFirst(label) : null;
}
