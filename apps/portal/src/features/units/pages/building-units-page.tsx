import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Button, DataTable, ErrorState, PageHeader } from "@hoa-mngr/ui";

import { useUnitControllerGetUnits } from "@/api/generated/property-units/property-units";

import { getBuildingUnitColumns } from "../components/building-units-table-columns";

/**
 * The building's unit register, as every member reads it.
 *
 * Who owns which unit, and how large it is, is public in the cadastre and in
 * the prohlášení vlastníka, so there is nothing here to keep from a
 * neighbour. The reader's own units are marked and carry their share of them
 * — the one fact about a co-owned unit that the register itself does not
 * state — and are the only rows with a detail to open.
 *
 * This replaced a separate "my units" page. Two lists of the same units in
 * one menu, one of them a subset of the other, was the split this removes.
 */
export function BuildingUnitsPage() {
    const { t } = useTranslation("common");
    const {
        data: units,
        isLoading,
        isError,
        refetch,
    } = useUnitControllerGetUnits();

    const ownsSomething = (units ?? []).some((unit) => unit.mine);

    const columns = useMemo(
        () => getBuildingUnitColumns(t, ownsSomething),
        [t, ownsSomething],
    );

    if (isError) {
        return (
            <div className="space-y-6">
                <PageHeader title={t("buildingUnits.title")} />
                <ErrorState
                    message={t("buildingUnits.loadError")}
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void refetch()}
                        >
                            {t("retry")}
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("buildingUnits.title")}
                description={t("buildingUnits.description")}
            />

            <DataTable
                columns={columns}
                data={units ?? []}
                gridTemplate={
                    ownsSomething
                        ? "1fr 0.9fr 1.2fr 1.6fr 1.3fr 60px"
                        : "1fr 0.9fr 1.2fr 1.8fr 60px"
                }
                minWidth={ownsSomething ? "900px" : "760px"}
                isLoading={isLoading}
                loadingMessage={t("loading")}
                emptyMessage={t("buildingUnits.empty")}
                emptySearchMessage={t("buildingUnits.noMatch")}
                searchPlaceholder={t("buildingUnits.searchPlaceholder")}
                initialSorting={[{ id: "unitNo", desc: false }]}
                countLabel={(info) =>
                    t("buildingUnits.table.count", { count: info.total })
                }
            />
        </div>
    );
}
