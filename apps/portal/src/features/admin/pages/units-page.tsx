import { PencilIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Button, ColumnDef, DataTable } from "@hoa-mngr/ui";

import type { UnitResponseDto } from "@/api/generated/model";
import { useUnitControllerGetUnits } from "@/api/generated/property-units/property-units";

import { CreateUnitDialog } from "../components/create-unit-dialog";

export function UnitsPage() {
    const { t } = useTranslation("admin");
    const { t: tCommon } = useTranslation("common");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: units, isLoading, refetch } = useUnitControllerGetUnits();

    const navigate = useNavigate();

    const columns: ColumnDef<UnitResponseDto>[] = [
        {
            header: t("units.table.unitNumber"),
            accessorKey: "unitNo",
            className: "font-medium",
        },
        {
            header: t("units.table.buildingShare"),
            accessorKey: "buildingShare",
        },
        {
            header: tCommon("actions"),
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                navigate(`/admin/units/${row.id}`);
                            }}
                        >
                            <PencilIcon className="h-4 w-4" />
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
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        {t("units.title")}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        {t("units.description")}
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    {t("units.addUnit")}
                </Button>
            </div>

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
        </div>
    );
}
