import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ConfirmDialog, toast } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import type { OwnerResponseDto } from "@/api/generated/model";
import {
    getOwnerControllerGetOwnersQueryKey,
    useOwnerControllerDeleteOwner,
} from "@/api/generated/property-owners/property-owners";

interface DeleteOwnerDialogProps {
    owner?: OwnerResponseDto | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function DeleteOwnerDialog({
    owner,
    open,
    onOpenChange,
    onSuccess,
}: DeleteOwnerDialogProps) {
    const { t } = useTranslation(["admin", "common"]);
    const queryClient = useQueryClient();

    const deleteOwner = useOwnerControllerDeleteOwner({
        mutation: {
            onSuccess: () => {
                toast.success(t("owners.delete.success"));
                queryClient.invalidateQueries({
                    queryKey: getOwnerControllerGetOwnersQueryKey(),
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
            title={t("owners.delete.title")}
            description={t("owners.delete.description", {
                name: owner?.displayName,
            })}
            confirmLabel={t("admin:owners.delete.confirm")}
            cancelLabel={t("owners.delete.cancel")}
            confirmingLabel={t("common:loading")}
            confirming={deleteOwner.isPending}
            onConfirm={() => {
                if (owner) deleteOwner.mutate({ ownerId: owner.id });
            }}
        />
    );
}
