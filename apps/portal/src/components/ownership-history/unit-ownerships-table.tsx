import { TFunction } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
    CellNumeric,
    DataTable,
    StatusChip,
    type ColumnDef,
} from "@hoa-mngr/ui";

import type { UnitOwnershipPeriodResponseDto } from "@/api/generated/model";

import { flattenPeriods, periodLabel, type OwnershipHistoryRow } from "./rows";

const STATUS_CHIP: Record<
    OwnershipHistoryRow["status"],
    {
        variant: "primary" | "success" | "neutral";
        key: "scheduled" | "active" | "closed";
    }
> = {
    SCHEDULED: { variant: "primary", key: "scheduled" },
    ACTIVE: { variant: "success", key: "active" },
    CLOSED: { variant: "neutral", key: "closed" },
};

export function getUnitOwnershipColumns(
    t: TFunction<"admin" | "common">,
): ColumnDef<OwnershipHistoryRow>[] {
    return [
        {
            id: "owner",
            header: t("units.details.ownership.owner"),
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <span className="text-foreground inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
                    <span className="truncate">
                        {row.original.party.members
                            .map((member) => member.displayName)
                            .join(", ")}
                    </span>
                    {row.original.party.partyType === "SJM" && (
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
                    value={`${row.original.party.shareNumerator}/${row.original.party.shareDenominator}`}
                    secondary={row.original.party.shareDecimal}
                />
            ),
        },
        {
            id: "period",
            header: t("units.details.ownership.period"),
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => (
                <span className="text-secondary-foreground text-sm tabular-nums">
                    {periodLabel(
                        row.original.validFrom,
                        row.original.validTo,
                        t("units.details.ownership.from"),
                    )}
                </span>
            ),
        },
        {
            id: "status",
            header: t("units.details.ownership.status"),
            enableSorting: false,
            enableGlobalFilter: false,
            cell: ({ row }) => {
                const chip = STATUS_CHIP[row.original.status];
                return (
                    <StatusChip variant={chip.variant}>
                        {t(`units.details.ownership.${chip.key}`)}
                    </StatusChip>
                );
            },
        },
    ];
}

interface UnitOwnershipsTableProps {
    periods: UnitOwnershipPeriodResponseDto[] | undefined;
    isLoading: boolean;
}

/**
 * Every ownership period of one unit, newest first. Shared by the admin
 * unit detail page and the owner-facing unit page — the two audiences
 * read the same record, so they read it through the same table.
 */
export function UnitOwnershipsTable({
    periods,
    isLoading,
}: UnitOwnershipsTableProps) {
    const { t } = useTranslation(["admin", "common"]);
    const columns = getUnitOwnershipColumns(t);
    const rows = useMemo(() => flattenPeriods(periods), [periods]);

    return (
        <DataTable
            columns={columns}
            data={rows}
            gridTemplate="1.5fr 1fr 1.4fr 130px"
            isLoading={isLoading}
            loadingMessage={t("loading", { ns: "common" })}
            emptyMessage={t("units.details.ownership.empty")}
            countLabel={() =>
                t("units.details.ownership.count", {
                    count: periods?.length ?? 0,
                })
            }
        />
    );
}
