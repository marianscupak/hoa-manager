import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { Button } from "@hoa-mngr/ui";

import { useOwnerControllerGetOwners } from "@/api/generated/property-owners/property-owners";
import { useUnitControllerGetUnitDetail } from "@/api/generated/property-units/property-units";

import { ReplaceOwnershipDialog } from "../components/replace-ownership-dialog/dialog";
import { UnitInfoCard } from "../components/unit-info-card";
import { UnitOwnershipsTable } from "../components/unit-ownerships-table";
import { UpdateUnitDialog } from "../components/update-unit-dialog";

export function UnitDetailPage() {
    const { id } = useParams();
    const { t } = useTranslation(["admin", "common"]);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isUnitEditOpen, setIsUnitEditOpen] = useState(false);

    if (!id) {
        throw new Error("No unit id provided");
    }

    const {
        data: unit,
        isLoading,
        refetch,
    } = useUnitControllerGetUnitDetail(id);
    const { data: owners } = useOwnerControllerGetOwners();

    if (isLoading) {
        return <div className="p-8 text-center">{t("common:loading")}</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
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
                <Button
                    variant="outline"
                    onClick={() => setIsUnitEditOpen(true)}
                >
                    <PencilIcon className="mr-2 h-4 w-4" />
                    {t("admin:units.details.editUnit")}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <UnitInfoCard unit={unit} />
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

                <UnitOwnershipsTable
                    ownerships={unit?.ownerships}
                    owners={owners}
                    isLoading={isLoading}
                    t={t}
                />
            </div>

            <ReplaceOwnershipDialog
                unitId={id}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                currentOwnerships={unit?.ownerships}
                onSuccess={() => refetch()}
            />

            <UpdateUnitDialog
                unit={unit}
                open={isUnitEditOpen}
                onOpenChange={setIsUnitEditOpen}
                onSuccess={() => refetch()}
            />
        </div>
    );
}
