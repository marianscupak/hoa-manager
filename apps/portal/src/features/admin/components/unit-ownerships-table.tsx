import { TFunction } from "i18next";

import { DataTable, ColumnDef } from "@hoa-mngr/ui";

import type {
    OwnerResponseDto,
    UnitOwnershipResponseDto,
} from "@/api/generated/model";

export function getUnitOwnershipColumns(
    t: TFunction<"admin" | "common">,
    owners: OwnerResponseDto[] | undefined,
): ColumnDef<UnitOwnershipResponseDto>[] {
    const getOwnerName = (ownerId: string) => {
        return owners?.find((o) => o.id === ownerId)?.displayName ?? ownerId;
    };

    return [
        {
            header: t("units.details.ownership.owner"),
            cell: ({ row }) => (
                <span className="text-foreground font-medium">
                    {getOwnerName(row.ownerId)}
                </span>
            ),
        },
        {
            header: t("units.details.ownership.share"),
            accessorKey: "share",
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {(parseFloat(row.share) * 100).toFixed(2)}%
                </span>
            ),
        },
        {
            header: t("units.details.ownership.since"),
            accessorKey: "validFrom",
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {new Date(row.validFrom).toLocaleDateString()}
                </span>
            ),
        },
        {
            header: t("units.details.ownership.active"),
            cell: () => (
                <span className="bg-success-muted text-success ring-success/20 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                    {t("units.details.ownership.active")}
                </span>
            ),
        },
    ];
}

interface UnitOwnershipsTableProps {
    ownerships: UnitOwnershipResponseDto[] | undefined;
    owners: OwnerResponseDto[] | undefined;
    isLoading: boolean;
    t: TFunction<"admin" | "common">;
}

export function UnitOwnershipsTable({
    ownerships,
    owners,
    isLoading,
    t,
}: UnitOwnershipsTableProps) {
    const columns = getUnitOwnershipColumns(t, owners);

    return (
        <DataTable
            columns={columns}
            data={ownerships ?? []}
            isLoading={isLoading}
            emptyMessage={t("units.details.ownership.empty")}
        />
    );
}
