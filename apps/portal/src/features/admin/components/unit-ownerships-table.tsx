import { TFunction } from "i18next";

import {
    CellNumeric,
    DataTable,
    StatusChip,
    type ColumnDef,
} from "@hoa-mngr/ui";

import type { UnitOwnershipResponseDto } from "@/api/generated/model";

export function getUnitOwnershipColumns(
    t: TFunction<"admin" | "common">,
): ColumnDef<UnitOwnershipResponseDto>[] {
    return [
        {
            id: "owner",
            header: t("units.details.ownership.owner"),
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <span className="text-foreground inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
                    <span className="truncate">
                        {row.original.members
                            .map((member) => member.displayName)
                            .join(", ")}
                    </span>
                    {row.original.partyType === "SJM" && (
                        <StatusChip variant="primary" dot={false}>
                            SJM
                        </StatusChip>
                    )}
                </span>
            ),
        },
        {
            id: "share",
            header: t("units.details.ownership.share"),
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <CellNumeric
                    value={`${row.original.shareNumerator}/${row.original.shareDenominator}`}
                    secondary={row.original.shareDecimal}
                />
            ),
        },
        {
            id: "active",
            header: t("units.details.ownership.active"),
            enableSorting: false,
            enableGlobalFilter: false,
            cell: () => (
                <StatusChip variant="success">
                    {t("units.details.ownership.active")}
                </StatusChip>
            ),
        },
    ];
}

interface UnitOwnershipsTableProps {
    ownerships: UnitOwnershipResponseDto[] | undefined;
    isLoading: boolean;
    t: TFunction<"admin" | "common">;
}

export function UnitOwnershipsTable({
    ownerships,
    isLoading,
    t,
}: UnitOwnershipsTableProps) {
    const columns = getUnitOwnershipColumns(t);

    return (
        <DataTable
            columns={columns}
            data={ownerships ?? []}
            gridTemplate="1.6fr 1.2fr 110px"
            isLoading={isLoading}
            loadingMessage={t("loading", { ns: "common" })}
            emptyMessage={t("units.details.ownership.empty")}
            countLabel={(info) =>
                t("units.details.ownership.count", { count: info.total })
            }
        />
    );
}
