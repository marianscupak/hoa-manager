import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { Button, PageLoading } from "@hoa-mngr/ui";

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

    if (isLoading) {
        return <PageLoading label={t("common:loading")} />;
    }

    return (
        <div className="space-y-8">
            <Link
                to="/admin/units"
                className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors"
            >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                {t("admin:units.details.backToUnits")}
            </Link>

            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-black tracking-tight">
                        {t("admin:units.details.title")}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {t("admin:units.details.info")}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUnitEditOpen(true)}
                >
                    <PencilIcon />
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditOpen(true)}
                    >
                        <PencilIcon />
                        {t("admin:units.details.ownership.edit")}
                    </Button>
                </div>

                <UnitOwnershipsTable
                    ownerships={unit?.ownerships}
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
