import { TFunction } from "i18next";

import { Badge, LegacyColumnDef, DataTableLegacy } from "@hoa-mngr/ui";

import type { UnitOwnershipResponseDto } from "@/api/generated/model";

export function getUnitOwnershipColumns(
    t: TFunction<"admin" | "common">,
): LegacyColumnDef<UnitOwnershipResponseDto>[] {
    return [
        {
            header: t("units.details.ownership.owner"),
            cell: ({ row }) => (
                <span className="text-foreground inline-flex items-center gap-2 font-medium">
                    {row.members.map((member) => member.displayName).join(", ")}
                    {row.partyType === "SJM" && (
                        <Badge variant="primaryTint">SJM</Badge>
                    )}
                </span>
            ),
        },
        {
            header: t("units.details.ownership.share"),
            cell: ({ row }) => (
                <span className="text-foreground">
                    {row.shareNumerator}/{row.shareDenominator}
                    <span className="text-muted-foreground ml-2 text-xs">
                        {row.shareDecimal}
                    </span>
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
        <DataTableLegacy
            columns={columns}
            data={ownerships ?? []}
            isLoading={isLoading}
            emptyMessage={t("units.details.ownership.empty")}
            loadingMessage={t("loading", { ns: "common" })}
        />
    );
}
