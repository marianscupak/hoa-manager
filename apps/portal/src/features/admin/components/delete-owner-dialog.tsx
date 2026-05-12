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

    const onConfirm = () => {
        if (!owner) return;
        deleteOwner.mutate({ ownerId: owner.id });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("owners.delete.title")}</DialogTitle>
                    <DialogDescription>
                        {t("owners.delete.description", {
                            name: owner?.displayName,
                        })}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={deleteOwner.isPending}
                    >
                        {t("owners.delete.cancel")}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={deleteOwner.isPending}
                    >
                        {deleteOwner.isPending
                            ? t("common:loading")
                            : t("admin:owners.delete.confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
