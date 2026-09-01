import { useTranslation } from "react-i18next";

import { StatusChip } from "@hoa-mngr/ui";

import type { OwnedUnitResponseDto } from "@/api/generated/model";

interface OwnedUnitsTableProps {
    units: OwnedUnitResponseDto[];
}

export function OwnedUnitsTable({ units }: OwnedUnitsTableProps) {
    const { t } = useTranslation("dashboard");
    const sorted = [...units].sort((a, b) =>
        a.unitNo.localeCompare(b.unitNo, undefined, { numeric: true }),
    );

    return (
        <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left text-xs uppercase">
                <tr>
                    <th className="py-2">{t("ownedUnits.columnUnit")}</th>
                    <th className="py-2 text-right">
                        {t("ownedUnits.columnOwnerShare")}
                    </th>
                    <th className="py-2 text-right">
                        {t("ownedUnits.columnBuildingShare")}
                    </th>
                </tr>
            </thead>
            <tbody>
                {sorted.map((u) => (
                    <tr key={u.id} className="border-t">
                        <td className="py-2">
                            <span className="inline-flex items-center gap-2">
                                {u.unitNo}
                                {u.ownerSharePct < 100 && (
                                    <StatusChip variant="warning">
                                        {t("ownedUnits.coOwned")}
                                    </StatusChip>
                                )}
                            </span>
                        </td>
                        <td className="py-2 text-right">
                            {u.ownerSharePct.toFixed(2)}%
                        </td>
                        <td className="py-2 text-right">
                            {u.buildingSharePct.toFixed(2)}%
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
