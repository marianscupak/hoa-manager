import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    toast,
} from "@hoa-mngr/ui";

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

    const onConfirm = () => {
        if (!unit) return;
        deleteUnit.mutate({ id: unit.id });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("units.delete.title")}</DialogTitle>
                    <DialogDescription>
                        {t("units.delete.description", {
                            unitNo: unit?.unitNo,
                        })}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={deleteUnit.isPending}
                    >
                        {t("units.delete.cancel")}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={deleteUnit.isPending}
                    >
                        {deleteUnit.isPending
                            ? t("common:loading")
                            : t("units.delete.confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
