import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Form,
    FormInput,
    toast,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import type { OwnerResponseDto } from "@/api/generated/model";
import {
    getOwnerControllerGetOwnersQueryKey,
    useOwnerControllerRenameOwner,
} from "@/api/generated/property-owners/property-owners";

const renameSchema = z.object({
    displayName: z.string().trim().min(1, "admin:owners.rename.required"),
});

type RenameOwnerValues = z.infer<typeof renameSchema>;

interface RenameOwnerDialogProps {
    owner: OwnerResponseDto | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

/**
 * Changes an owner's name wherever they appear, history included — the
 * register keeps one name per person, so a marriage or a corrected spelling
 * is an edit, not a new owner.
 */
export function RenameOwnerDialog({
    owner,
    open,
    onOpenChange,
    onSuccess,
}: RenameOwnerDialogProps) {
    const { t } = useTranslation(["admin"]);
    const queryClient = useQueryClient();

    const form = useForm<RenameOwnerValues>({
        resolver: zodResolver(renameSchema),
        defaultValues: { displayName: "" },
    });

    // The field starts on the current name so a one-word correction does not
    // mean retyping the whole thing.
    useEffect(() => {
        if (open && owner) form.reset({ displayName: owner.displayName });
    }, [open, owner, form]);

    const renameOwner = useOwnerControllerRenameOwner({
        mutation: {
            onSuccess: () => {
                toast.success(t("owners.rename.success"));
                queryClient.invalidateQueries({
                    queryKey: getOwnerControllerGetOwnersQueryKey(),
                });
                onOpenChange(false);
                onSuccess?.();
            },
            onError: showApiError,
        },
    });

    const onSubmit = (values: RenameOwnerValues) => {
        if (!owner) return;
        renameOwner.mutate({
            ownerId: owner.id,
            data: { displayName: values.displayName.trim() },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("owners.rename.title")}</DialogTitle>
                    <DialogDescription>
                        {t("owners.rename.description")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormInput
                            name="displayName"
                            label={t("owners.rename.nameLabel")}
                        />
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={renameOwner.isPending}
                            >
                                {renameOwner.isPending
                                    ? t("owners.rename.submitting")
                                    : t("owners.rename.submit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
