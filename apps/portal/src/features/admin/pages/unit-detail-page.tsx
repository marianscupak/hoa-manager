import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { Button, PageLoading } from "@hoa-mngr/ui";

import {
    useUnitControllerGetOwnershipHistory,
    useUnitControllerGetUnitDetail,
} from "@/api/generated/property-units/property-units";

import {
    findScheduledPeriod,
    latestPeriodStart,
} from "@/components/ownership-history/rows";
import { ScheduledTransferBanner } from "@/components/ownership-history/scheduled-transfer-banner";
import { UnitOwnershipsTable } from "@/components/ownership-history/unit-ownerships-table";

import { CancelScheduledTransferDialog } from "../components/ownership-history/cancel-scheduled-transfer-dialog";
import { ReplaceOwnershipDialog } from "../components/replace-ownership-dialog/dialog";
import { UnitInfoCard } from "../components/unit-info-card";
import { UpdateUnitDialog } from "../components/update-unit-dialog";

export function UnitDetailPage() {
    const { id } = useParams();
    const { t } = useTranslation(["admin", "common"]);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isUnitEditOpen, setIsUnitEditOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    if (!id) {
        throw new Error("No unit id provided");
    }

    const {
        data: unit,
        isLoading,
        refetch,
    } = useUnitControllerGetUnitDetail(id);
    const {
        data: history,
        isLoading: isHistoryLoading,
        refetch: refetchHistory,
    } = useUnitControllerGetOwnershipHistory(id);

    const scheduled = findScheduledPeriod(history?.periods);
    const minEffectiveFrom = useMemo(
        () => latestPeriodStart(history?.periods),
        [history?.periods],
    );
    const refetchAll = () => {
        refetch();
        refetchHistory();
    };

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
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-foreground text-lg font-semibold">
                        {t("admin:units.details.ownership.title")}
                    </h2>
                    <div className="flex flex-col items-end gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditOpen(true)}
                            disabled={
                                isHistoryLoading || scheduled !== undefined
                            }
                        >
                            <PencilIcon />
                            {t("admin:units.details.ownership.edit")}
                        </Button>
                        {scheduled && (
                            <span className="text-muted-foreground text-detail">
                                {t(
                                    "admin:units.details.ownership.editBlockedHint",
                                )}
                            </span>
                        )}
                    </div>
                </div>

                {scheduled && (
                    <ScheduledTransferBanner
                        effectiveFrom={scheduled.validFrom}
                        onCancel={() => setIsCancelOpen(true)}
                    />
                )}

                <UnitOwnershipsTable
                    periods={history?.periods}
                    isLoading={isHistoryLoading}
                />
            </div>

            <ReplaceOwnershipDialog
                unitId={id}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                currentOwnerships={unit?.ownerships}
                minEffectiveFrom={minEffectiveFrom}
                onSuccess={refetchAll}
            />

            <CancelScheduledTransferDialog
                unitId={id}
                effectiveFrom={scheduled?.validFrom}
                open={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                onSuccess={refetchAll}
            />

            <UpdateUnitDialog
                unit={unit}
                open={isUnitEditOpen}
                onOpenChange={setIsUnitEditOpen}
                onSuccess={refetchAll}
            />
        </div>
    );
}
