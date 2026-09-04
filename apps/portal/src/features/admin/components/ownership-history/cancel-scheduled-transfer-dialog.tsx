import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ConfirmDialog, toast } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import {
    getUnitControllerGetOwnershipHistoryQueryKey,
    getUnitControllerGetUnitDetailQueryKey,
    getUnitControllerGetUnitsQueryKey,
    useUnitControllerCancelScheduledOwnershipTransfer,
} from "@/api/generated/property-units/property-units";

import { formatPeriodDate } from "@/components/ownership-history/rows";

interface CancelScheduledTransferDialogProps {
    unitId: string;
    /** ISO instant of the scheduled period's start; undefined while loading. */
    effectiveFrom?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CancelScheduledTransferDialog({
    unitId,
    effectiveFrom,
    open,
    onOpenChange,
    onSuccess,
}: CancelScheduledTransferDialogProps) {
    const { t } = useTranslation(["admin", "common"]);
    const queryClient = useQueryClient();

    const cancelTransfer = useUnitControllerCancelScheduledOwnershipTransfer({
        mutation: {
            onSuccess: () => {
                toast.success(
                    t("units.details.ownership.cancelDialog.success"),
                );
                queryClient.invalidateQueries({
                    queryKey:
                        getUnitControllerGetOwnershipHistoryQueryKey(unitId),
                });
                queryClient.invalidateQueries({
                    queryKey: getUnitControllerGetUnitDetailQueryKey(unitId),
                });
                queryClient.invalidateQueries({
                    queryKey: getUnitControllerGetUnitsQueryKey(),
                });
                onOpenChange(false);
                onSuccess?.();
            },
            onError: showApiError,
        },
    });

    return (
        <ConfirmDialog
            open={open}
            onOpenChange={onOpenChange}
            title={t("units.details.ownership.cancelDialog.title")}
            description={t("units.details.ownership.cancelDialog.description", {
                date: effectiveFrom ? formatPeriodDate(effectiveFrom) : "",
            })}
            confirmLabel={t("units.details.ownership.cancelDialog.confirm")}
            cancelLabel={t("units.details.ownership.cancelDialog.cancel")}
            confirmingLabel={t("common:loading")}
            confirming={cancelTransfer.isPending}
            onConfirm={() => cancelTransfer.mutate({ id: unitId })}
        />
    );
}
