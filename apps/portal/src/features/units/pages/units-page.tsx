import { useAtomValue } from "jotai";
import { AlertTriangleIcon, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

import {
    Button,
    DataTable,
    ErrorState,
    formatPercentValue,
    PageHeader,
} from "@hoa-mngr/ui";

import type { UnitResponseDto } from "@/api/generated/model";
import { useUnitControllerGetUnits } from "@/api/generated/property-units/property-units";
import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";
import { Role } from "@/auth/roles";
import { CreateUnitDialog } from "@/features/admin/components/create-unit-dialog";
import { DeleteUnitDialog } from "@/features/admin/components/delete-unit-dialog";

import { getUnitColumns, unitsGridTemplate } from "../components/unit-columns";

/**
 * The building's units as one screen for the whole association.
 *
 * Who owns which unit and how large it is is public within the building, so
 * every member reads the same rows; the board gets the actions that change
 * them and the warning when the shares stop adding up, and an owner gets the
 * column that says how much of a unit is theirs. The server is what enforces
 * that — this only decides what to render out of what it was given.
 */
export function UnitsPage() {
    const { t } = useTranslation(["common", "admin"]);
    const { t: tKatastr } = useTranslation("katastr");
    const tenantCtx = useAtomValue(tenantContextAtom);

    const canManage = isAdminOrBoard(tenantCtx?.roles);
    // The import is a bulk write that is hard to unwind, so it follows the
    // ADMIN-only rule the endpoint itself enforces — a board member, allowed
    // everywhere else on this page, must not be offered it.
    const isAdmin = !!tenantCtx?.roles.includes(Role.ADMIN);

    const [createOpen, setCreateOpen] = useState(false);
    const [deletingUnit, setDeletingUnit] = useState<UnitResponseDto | null>(
        null,
    );

    const {
        data: units,
        isLoading,
        isError,
        refetch,
    } = useUnitControllerGetUnits();

    const ownsSomething = (units ?? []).some((unit) => unit.mine);
    // The board reads the register to administer it; their own flat is beside
    // the point there, and the column would push the actions off a narrow
    // screen for everyone.
    const showMyShare = !canManage && ownsSomething;

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
        () =>
            getUnitColumns(t, {
                canManage,
                showMyShare,
                onDelete: (unit) => setDeletingUnit(unit),
            }),
        [t, canManage, showMyShare],
    );

    if (isError) {
        return (
            <ErrorState
                message={t("admin:units.loadError")}
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
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <PageHeader
                    title={t("buildingUnits.title")}
                    description={
                        canManage
                            ? t("admin:units.description")
                            : t("buildingUnits.description")
                    }
                />
                {canManage && (
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <Button asChild variant="outline">
                                <NavLink to="/units/import">
                                    {tKatastr("title")}
                                </NavLink>
                            </Button>
                        )}
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus /> {t("admin:units.addUnit")}
                        </Button>
                    </div>
                )}
            </div>

            {canManage && !isSumValid && units && units.length > 0 && (
                <div className="rounded-panel border-warning-tint-border bg-warning-muted shadow-clay-card-amber flex items-center gap-3 border px-[18px] py-3">
                    <AlertTriangleIcon className="text-warning-tint-foreground h-4 w-4 shrink-0" />
                    <p className="text-warning-deep flex-1 text-sm leading-[19px]">
                        {t("admin:units.sumBanner", {
                            sum: formatPercentValue(sumOfFractions * 100),
                            off: offPercent,
                        })}
                    </p>
                </div>
            )}

            <DataTable
                columns={columns}
                data={units ?? []}
                gridTemplate={unitsGridTemplate({ canManage, showMyShare })}
                minWidth={showMyShare ? "940px" : "800px"}
                isLoading={isLoading}
                loadingMessage={t("loading")}
                emptyMessage={t("buildingUnits.empty")}
                emptySearchMessage={t("buildingUnits.noMatch")}
                searchPlaceholder={t("buildingUnits.searchPlaceholder")}
                initialSorting={[{ id: "unitNo", desc: false }]}
                countLabel={(info) =>
                    info.paginated
                        ? t("admin:units.table.range", {
                              from: info.from,
                              to: info.to,
                              total: info.total,
                          })
                        : t("buildingUnits.table.count", {
                              count: info.total,
                          })
                }
                paginationLabels={{
                    previous: t("pagination.previous"),
                    next: t("pagination.next"),
                }}
            />

            {canManage && (
                <>
                    <CreateUnitDialog
                        open={createOpen}
                        onOpenChange={setCreateOpen}
                        onSuccess={refetch}
                    />
                    <DeleteUnitDialog
                        unit={deletingUnit}
                        open={!!deletingUnit}
                        onOpenChange={(open) => !open && setDeletingUnit(null)}
                        onSuccess={refetch}
                    />
                </>
            )}
        </div>
    );
}
