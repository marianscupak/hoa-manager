import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { Button, DataTable, ColumnDef } from "@hoa-mngr/ui";

import type { UnitOwnershipResponseDto } from "@/api/generated/model";
import { useOwnerControllerGetOwners } from "@/api/generated/property-owners/property-owners";
import { useUnitControllerGetUnitDetail } from "@/api/generated/property-units/property-units";

import { ReplaceOwnershipDialog } from "../components/replace-ownership-dialog";

export function UnitDetailPage() {
    const { id } = useParams();
    const { t } = useTranslation(["admin", "common"]);
    const [isEditOpen, setIsEditOpen] = useState(false);

    if (!id) {
        throw new Error("No unit id provided");
    }

    const {
        data: unit,
        isLoading,
        refetch,
    } = useUnitControllerGetUnitDetail(id);
    const { data: owners } = useOwnerControllerGetOwners();

    console.log(unit);

    const getOwnerName = (ownerId: string) => {
        return owners?.find((o) => o.id === ownerId)?.displayName ?? ownerId;
    };

    const columns: ColumnDef<UnitOwnershipResponseDto>[] = [
        {
            header: t("admin:units.details.ownership.owner"),
            cell: ({ row }) => (
                <span className="text-foreground font-medium">
                    {getOwnerName(row.ownerId)}
                </span>
            ),
        },
        {
            header: t("admin:units.details.ownership.share"),
            accessorKey: "share",
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {(parseFloat(row.share) * 100).toFixed(2)}%
                </span>
            ),
        },
        {
            header: t("admin:units.details.ownership.since"),
            accessorKey: "validFrom",
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {new Date(row.validFrom).toLocaleDateString()}
                </span>
            ),
        },
        {
            header: t("admin:units.details.ownership.active"),
            cell: () => (
                <span className="bg-success-muted text-success ring-success/20 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                    {t("admin:units.details.ownership.active")}
                </span>
            ),
        },
    ];

    if (isLoading) {
        return <div className="p-8 text-center">{t("common:loading")}</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/admin/units">
                        <ArrowLeftIcon className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-foreground text-2xl font-bold tracking-tight">
                        {t("admin:units.details.title")}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {t("admin:units.details.info")}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-card rounded-xl border p-6 shadow-sm">
                    <h2 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
                        {t("admin:units.details.info")}
                    </h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-muted-foreground text-sm">
                                {t("admin:units.details.unitNo")}
                            </dt>
                            <dd className="text-foreground text-lg font-medium">
                                {unit?.unitNo}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground text-sm">
                                {t("admin:units.details.buildingShare")}
                            </dt>
                            <dd className="text-foreground text-lg font-medium">
                                {(
                                    parseFloat(unit?.buildingShare ?? "0") * 100
                                ).toFixed(2)}
                                %
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-foreground text-lg font-semibold">
                        {t("admin:units.details.ownership.title")}
                    </h2>
                    <Button onClick={() => setIsEditOpen(true)} size="sm">
                        <PencilIcon className="mr-2 h-4 w-4" />
                        {t("admin:units.details.ownership.edit")}
                    </Button>
                </div>

                <DataTable
                    columns={columns}
                    data={unit?.ownerships ?? []}
                    isLoading={isLoading}
                    emptyMessage={t("admin:units.details.ownership.empty")}
                />
            </div>

            <ReplaceOwnershipDialog
                unitId={id}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                currentOwnerships={unit?.ownerships}
                onSuccess={() => refetch()}
            />
        </div>
    );
}
