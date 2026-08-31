import { TFunction } from "i18next";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Link } from "react-router";

import {
    Button,
    CellNumeric,
    WarningPill,
    type ColumnDef,
} from "@hoa-mngr/ui";

import type { UnitResponseDto } from "@/api/generated/model";

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
            id: "share",
            accessorFn: (row) =>
                row.buildingShareNumerator / row.buildingShareDenominator,
            header: t("units.table.buildingShare"),
            enableSorting: true,
            sortDescFirst: true,
            enableGlobalFilter: false,
            cell: ({ row }) => {
                const percent = (
                    (row.original.buildingShareNumerator /
                        row.original.buildingShareDenominator) *
                    100
                ).toFixed(1);
                return (
                    <CellNumeric
                        value={`${percent} %`}
                        secondary={`${row.original.buildingShareNumerator}/${row.original.buildingShareDenominator}`}
                    />
                );
            },
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
                    <WarningPill>{t("units.table.noOwner")}</WarningPill>
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
