import {
    AlertTriangleIcon,
    PencilIcon,
    PlusIcon,
    Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
    Button,
    Card,
    CardContent,
    ColumnDef,
    DataTable,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@hoa-mngr/ui";

import type { UnitResponseDto } from "@/api/generated/model";
import { useUnitControllerGetUnits } from "@/api/generated/property-units/property-units";

import { CreateUnitDialog } from "../components/create-unit-dialog";
import { DeleteUnitDialog } from "../components/delete-unit-dialog";

export function UnitsPage() {
    const { t } = useTranslation("admin");
    const { t: tCommon } = useTranslation("common");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
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

    const columns: ColumnDef<UnitResponseDto>[] = [
        {
            header: t("units.table.unitNumber"),
            accessorKey: "unitNo",
            className: "font-medium",
        },
        {
            header: t("units.table.buildingShare"),
            accessorKey: "buildingShareNumerator",
            cell: ({ row }) =>
                `${row.buildingShareNumerator}/${row.buildingShareDenominator}`,
        },
        {
            header: tCommon("actions"),
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" asChild>
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
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-foreground text-2xl font-bold tracking-tight">
                        {t("units.title")}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        {t("units.description")}
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    {t("units.addUnit")}
                </Button>
            </div>

            {units && units.length > 0 && (
                <Card
                    className={
                        isSumValid
                            ? "bg-muted/30"
                            : "border-warning bg-warning/5"
                    }
                >
                    <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <div
                                className={`rounded-full p-2 ${
                                    isSumValid
                                        ? "bg-primary/10 text-primary"
                                        : "bg-warning/20 text-warning"
                                }`}
                            >
                                <AlertTriangleIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    {t("units.sumOfFractions.total")}
                                </p>
                                <p
                                    className={`text-2xl font-bold ${!isSumValid && "text-warning"}`}
                                >
                                    {sumOfFractions.toLocaleString(undefined, {
                                        maximumFractionDigits: 6,
                                    })}
                                </p>
                            </div>
                        </div>
                        {!isSumValid && (
                            <p className="text-warning text-sm font-medium">
                                {t("units.sumOfFractions.warning", {
                                    sum: sumOfFractions.toFixed(6),
                                })}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            <DataTable
                columns={columns}
                data={units ?? []}
                isLoading={isLoading}
                emptyMessage={t("units.empty")}
            />

            <CreateUnitDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
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
