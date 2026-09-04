import { TFunction } from "i18next";
import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router";

import {
    Button,
    CellNumeric,
    formatPercent,
    StatusChip,
    type ColumnDef,
} from "@hoa-mngr/ui";

import type { OwnedUnitResponseDto } from "@/api/generated/model";

import { isCoOwnedShare, sharePercent } from "../utils/shares";

/**
 * Columns for the owner-facing unit list.
 *
 * Every share leads with the fraction and carries the percentage as the
 * secondary value: the fraction is the number the association's
 * documents state, so it is the one an owner is looking for. The
 * percentages are recomputed from the fractions rather than read from
 * the API's rounded fields, so both values on screen always agree.
 */
export function getMyUnitColumns(
    t: TFunction<"common">,
): ColumnDef<OwnedUnitResponseDto>[] {
    return [
        {
            id: "unitNo",
            accessorKey: "unitNo",
            header: t("myUnits.table.unitNumber"),
            enableSorting: true,
            sortingFn: "localeNumeric",
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <span className="text-foreground inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
                    <span className="truncate">{row.original.unitNo}</span>
                    {isCoOwnedShare(
                        row.original.shareNumerator,
                        row.original.shareDenominator,
                    ) && (
                        <StatusChip variant="warning">
                            {t("myUnits.table.coOwned")}
                        </StatusChip>
                    )}
                </span>
            ),
        },
        {
            id: "ownerShare",
            header: t("myUnits.table.ownerShare"),
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <CellNumeric
                    value={`${row.original.shareNumerator}/${row.original.shareDenominator}`}
                    secondary={formatPercent(
                        sharePercent(
                            row.original.shareNumerator,
                            row.original.shareDenominator,
                        ),
                    )}
                />
            ),
        },
        {
            id: "buildingShare",
            header: t("myUnits.table.buildingShare"),
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <CellNumeric
                    value={`${row.original.buildingShareNumerator}/${row.original.buildingShareDenominator}`}
                    secondary={formatPercent(
                        sharePercent(
                            row.original.buildingShareNumerator,
                            row.original.buildingShareDenominator,
                        ),
                    )}
                />
            ),
        },
        {
            id: "actions",
            header: "",
            enableSorting: false,
            enableGlobalFilter: false,
            meta: { align: "right" },
            cell: ({ row }) => (
                <Button
                    variant="tableAction"
                    size="tableIcon"
                    aria-label={t("myUnits.table.openDetail")}
                    asChild
                >
                    <Link to={`/units/${row.original.id}`}>
                        <ChevronRightIcon />
                    </Link>
                </Button>
            ),
        },
    ];
}
