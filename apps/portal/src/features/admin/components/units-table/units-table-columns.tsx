import { TFunction } from "i18next";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Link } from "react-router";

import {
    Button,
    CellNumeric,
    StatusChip,
    type ColumnDef,
} from "@hoa-mngr/ui";

import type { UnitResponseDto } from "@/api/generated/model";
import { shareCellValues } from "@/features/units/utils/shares";

import { capitalizeFirst } from "./capitalize-first";

/**
 * One track per column below (unitNo, usage, share, owners, actions) — kept
 * next to `getUnitColumns` and checked against it in
 * units-table-columns.test.ts, so the two can never drift the way they did
 * when the `usage` column was added without a matching track.
 */
export const UNITS_TABLE_GRID_TEMPLATE = "1.1fr 0.9fr 1.4fr 1.5fr 88px";

export function getUnitColumns(
    t: TFunction<"admin">,
    onDelete: (unit: UnitResponseDto) => void,
): ColumnDef<UnitResponseDto>[] {
    return [
        {
            id: "unitNo",
            accessorKey: "unitNo",
            header: t("units.table.unitNumber"),
            enableSorting: true,
            sortingFn: "localeNumeric",
            enableGlobalFilter: true,
            cell: ({ row }) => (
                <span className="text-foreground truncate text-sm font-semibold">
                    {row.original.unitNo}
                </span>
            ),
        },
        {
            id: "usage",
            header: t("units.table.usage"),
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => {
                const { usageCode, usageName } = row.original;
                if (!usageCode && !usageName) {
                    return (
                        <span className="text-faint text-detail">
                            {t("units.table.usageUnknown")}
                        </span>
                    );
                }
                // i18next returns the key itself when it is missing, which
                // is the signal to fall back to the cadastre's own Czech
                // wording (the sample extract only carries codes 1 and 5).
                const key = `units.table.usage_${usageCode}`;
                const translated = t(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    key as any,
                ) as string;
                const label = translated === key ? usageName ?? "" : translated;
                // A code with neither a known translation nor a cadastre
                // name to fall back on (both columns are independently
                // nullable) still reads as "not stated" rather than an
                // empty chip.
                if (!label) {
                    return (
                        <span className="text-faint text-detail">
                            {t("units.table.usageUnknown")}
                        </span>
                    );
                }
                return (
                    <StatusChip variant="neutral" dot={false}>
                        {capitalizeFirst(label)}
                    </StatusChip>
                );
            },
        },
        {
            id: "share",
            accessorFn: (row) =>
                row.buildingShareNumerator / row.buildingShareDenominator,
            header: t("units.table.buildingShare"),
            enableSorting: true,
            sortDescFirst: true,
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <CellNumeric
                    {...shareCellValues(
                        row.original.buildingShareNumerator,
                        row.original.buildingShareDenominator,
                    )}
                />
            ),
        },
        {
            id: "owners",
            accessorFn: (row) => row.owners.join(", "),
            header: t("units.table.owners"),
            enableSorting: false,
            enableGlobalFilter: true,
            cell: ({ row }) =>
                row.original.owners.length > 0 ? (
                    <span className="text-secondary-foreground block truncate text-sm">
                        {row.original.owners.join(", ")}
                    </span>
                ) : (
                    <StatusChip variant="warning">
                        {t("units.table.noOwner")}
                    </StatusChip>
                ),
        },
        {
            id: "actions",
            header: "",
            enableSorting: false,
            enableGlobalFilter: false,
            meta: { align: "right" },
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="tableAction"
                        size="tableIcon"
                        aria-label={t("units.details.ownership.edit")}
                        asChild
                    >
                        <Link to={`/admin/units/${row.original.id}`}>
                            <PencilIcon />
                        </Link>
                    </Button>
                    <Button
                        variant="tableActionDanger"
                        size="tableIcon"
                        aria-label={t("units.delete.title")}
                        onClick={() => onDelete(row.original)}
                    >
                        <Trash2Icon />
                    </Button>
                </div>
            ),
        },
    ];
}
