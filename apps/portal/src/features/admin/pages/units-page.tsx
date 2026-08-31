import { AlertTriangleIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
    Button,
    LegacyColumnDef,
    DataTableLegacy,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@hoa-mngr/ui";

import type { UnitResponseDto } from "@/api/generated/model";
import { useUnitControllerGetUnits } from "@/api/generated/property-units/property-units";

import { CreateUnitDialog } from "../components/create-unit-dialog";
import { DeleteUnitDialog } from "../components/delete-unit-dialog";

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

    const { data: units, isLoading, refetch } = useUnitControllerGetUnits();

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
    // drift as "0.00 %"; keep four and trim the zeros toFixed pads with.
    const offPercent = (Math.abs(1 - sumOfFractions) * 100)
        .toFixed(4)
        .replace(/\.?0+$/, "");

    const columns: LegacyColumnDef<UnitResponseDto>[] = [
        {
            header: t("units.table.unitNumber"),
            accessorKey: "unitNo",
            className: "font-semibold",
        },
        {
            header: t("units.table.buildingShare"),
            accessorKey: "buildingShareNumerator",
            cell: ({ row }) => {
                const percent = (
                    (row.buildingShareNumerator /
                        row.buildingShareDenominator) *
                    100
                ).toFixed(2);
                return (
                    <span>
                        {row.buildingShareNumerator}/
                        {row.buildingShareDenominator}{" "}
                        <span className="text-muted-foreground">
                            ({percent} %)
                        </span>
                    </span>
                );
            },
        },
        {
            header: tCommon("actions"),
            className: "text-right",
            cell: ({ row }) => {
                return (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                        >
                            <Link to={`/admin/units/${row.id}`}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PencilIcon className="h-4 w-4" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {t("units.details.ownership.edit")}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                            onClick={() => setDeletingUnit(row)}
                        >
                            <Trash2Icon className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            {!isSumValid && units && units.length > 0 && (
                <div className="rounded-panel border-warning-tint-border bg-warning-muted shadow-clay-card-amber flex items-center gap-3 border px-[18px] py-3">
                    <AlertTriangleIcon className="text-warning-tint-foreground h-[17px] w-[17px] shrink-0" />
                    <p className="text-warning-deep flex-1 text-sm leading-[19px]">
                        {t("units.sumBanner", {
                            sum: (sumOfFractions * 100).toFixed(2),
                            off: offPercent,
                        })}
                    </p>
                </div>
            )}

            <DataTableLegacy
                columns={columns}
                data={units ?? []}
                isLoading={isLoading}
                emptyMessage={t("units.empty")}
                loadingMessage={tCommon("loading")}
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
