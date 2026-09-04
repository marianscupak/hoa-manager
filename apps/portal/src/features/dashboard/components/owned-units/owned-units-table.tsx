import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { formatPercent, StatusChip } from "@hoa-mngr/ui";

import type { OwnedUnitResponseDto } from "@/api/generated/model";
import { isCoOwnedShare, sharePercent } from "@/features/units/utils/shares";

interface OwnedUnitsTableProps {
    units: OwnedUnitResponseDto[];
}

/**
 * Compact readout of the caller's units on the dashboard.
 *
 * Each share leads with the stored fraction, which is the number the
 * association's documents state, and carries the percentage underneath.
 * The full list and the per-unit page live at /units.
 */
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
                                <Link
                                    to={`/units/${u.id}`}
                                    className="text-foreground hover:text-primary-hover font-medium transition-colors"
                                >
                                    {u.unitNo}
                                </Link>
                                {isCoOwnedShare(
                                    u.shareNumerator,
                                    u.shareDenominator,
                                ) && (
                                    <StatusChip variant="warning">
                                        {t("ownedUnits.coOwned")}
                                    </StatusChip>
                                )}
                            </span>
                        </td>
                        <td className="py-2 text-right tabular-nums">
                            <span className="text-foreground block font-medium">
                                {u.shareNumerator}/{u.shareDenominator}
                            </span>
                            <span className="text-faint text-detail">
                                {formatPercent(
                                    sharePercent(
                                        u.shareNumerator,
                                        u.shareDenominator,
                                    ),
                                )}
                            </span>
                        </td>
                        <td className="py-2 text-right tabular-nums">
                            <span className="text-foreground block font-medium">
                                {u.buildingShareNumerator}/
                                {u.buildingShareDenominator}
                            </span>
                            <span className="text-faint text-detail">
                                {formatPercent(
                                    sharePercent(
                                        u.buildingShareNumerator,
                                        u.buildingShareDenominator,
                                    ),
                                )}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
