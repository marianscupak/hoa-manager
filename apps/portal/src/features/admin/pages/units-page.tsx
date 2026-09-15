import { AlertTriangleIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Button,
    DataTable,
    ErrorState,
    formatPercentValue,
} from "@hoa-mngr/ui";

import type { UnitResponseDto } from "@/api/generated/model";
import { useUnitControllerGetUnits } from "@/api/generated/property-units/property-units";

import { CreateUnitDialog } from "../components/create-unit-dialog";
import { DeleteUnitDialog } from "../components/delete-unit-dialog";
import {
    getUnitColumns,
    UNITS_TABLE_GRID_TEMPLATE,
} from "../components/units-table/units-table-columns";

export interface UnitsPageProps {
    createOpen: boolean;
    onCreateOpenChange: (open: boolean) => void;
}

export function UnitsPage({ createOpen, onCreateOpenChange }: UnitsPageProps) {
    const { t } = useTranslation("admin");
    const { t: tCommon } = useTranslation("common");
    const [deletingUnit, setDeletingUnit] = useState<UnitResponseDto | null>(
        null,
    );

    const {
        data: units,
        isLoading,
        isError,
        refetch,
    } = useUnitControllerGetUnits();

    const sumOfFractions = useMemo(() => {
        if (!units || units.length === 0) return 0;
        return units.reduce(
            (acc, unit) =>
                acc +
                unit.buildingShareNumerator / unit.buildingShareDenominator,
            0,
        );
    }, [units]);

    const isSumValid = Math.abs(sumOfFractions - 1) < 0.000001;

    // The drift, expressed in the same unit as the sum itself (percent) so the
    // banner does not mix a percentage with a bare fraction. The validity gate
    // is 1e-6 on the fraction — 0.0001 % — so two decimals would print a real
    // drift as "0.00 %"; keep four and trim the trailing zeros.
    const offPercent = formatPercentValue(
        Math.abs(1 - sumOfFractions) * 100,
        4,
    );

    const columns = useMemo(
        () => getUnitColumns(t, (unit) => setDeletingUnit(unit)),
        [t],
    );

    if (isError) {
        return (
            <ErrorState
                message={t("units.loadError")}
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void refetch()}
                    >
                        {tCommon("retry")}
                    </Button>
                }
            />
        );
    }

    return (
        <div className="space-y-6">
            {!isSumValid && units && units.length > 0 && (
                <div className="rounded-panel border-warning-tint-border bg-warning-muted shadow-clay-card-amber flex items-center gap-3 border px-[18px] py-3">
                    <AlertTriangleIcon className="text-warning-tint-foreground h-4 w-4 shrink-0" />
                    <p className="text-warning-deep flex-1 text-sm leading-[19px]">
                        {t("units.sumBanner", {
                            sum: formatPercentValue(sumOfFractions * 100),
                            off: offPercent,
                        })}
                    </p>
                </div>
            )}

            <DataTable
                columns={columns}
                data={units ?? []}
                gridTemplate={UNITS_TABLE_GRID_TEMPLATE}
                isLoading={isLoading}
                loadingMessage={tCommon("loading")}
                emptyMessage={t("units.empty")}
                emptySearchMessage={t("units.table.noMatch")}
                searchPlaceholder={t("units.table.searchPlaceholder")}
                initialSorting={[{ id: "unitNo", desc: false }]}
                countLabel={(info) =>
                    info.paginated
                        ? t("units.table.range", {
                              from: info.from,
                              to: info.to,
                              total: info.total,
                          })
                        : t("units.table.count", { count: info.total })
                }
                paginationLabels={{
                    previous: tCommon("pagination.previous"),
                    next: tCommon("pagination.next"),
                }}
            />

            <CreateUnitDialog
                open={createOpen}
                onOpenChange={onCreateOpenChange}
                onSuccess={refetch}
            />

            <DeleteUnitDialog
                unit={deletingUnit}
                open={!!deletingUnit}
                onOpenChange={(open) => !open && setDeletingUnit(null)}
                onSuccess={refetch}
            />
        </div>
    );
}
