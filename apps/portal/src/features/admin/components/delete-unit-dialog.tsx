import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ConfirmDialog, toast } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import type { UnitResponseDto } from "@/api/generated/model";
import {
    getUnitControllerGetUnitsQueryKey,
    useUnitControllerDeleteUnit,
} from "@/api/generated/property-units/property-units";

interface DeleteUnitDialogProps {
    unit?: UnitResponseDto | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function DeleteUnitDialog({
    unit,
    open,
    onOpenChange,
    onSuccess,
}: DeleteUnitDialogProps) {
    const { t } = useTranslation(["admin", "common"]);
    const queryClient = useQueryClient();

    const deleteUnit = useUnitControllerDeleteUnit({
        mutation: {
            onSuccess: () => {
                toast.success(t("units.delete.success"));
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
            title={t("units.delete.title")}
            description={t("units.delete.description", {
                unitNo: unit?.unitNo,
            })}
            confirmLabel={t("units.delete.confirm")}
            cancelLabel={t("units.delete.cancel")}
            confirmingLabel={t("common:loading")}
            confirming={deleteUnit.isPending}
            onConfirm={() => {
                if (unit) deleteUnit.mutate({ id: unit.id });
            }}
        />
    );
}
