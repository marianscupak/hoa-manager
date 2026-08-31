import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
    useOwnerControllerSetOwnerEmail,
} from "@/api/generated/property-owners/property-owners";

const emailSchema = z.object({
    email: z.string().email("admin:owners.addEmail.invalid"),
});

type AddOwnerEmailValues = z.infer<typeof emailSchema>;

interface AddOwnerEmailDialogProps {
    owner: OwnerResponseDto | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function AddOwnerEmailDialog({
    owner,
    open,
    onOpenChange,
    onSuccess,
}: AddOwnerEmailDialogProps) {
    const { t } = useTranslation(["admin"]);
    const queryClient = useQueryClient();

    const setOwnerEmail = useOwnerControllerSetOwnerEmail({
        mutation: {
            onSuccess: () => {
                toast.success(t("owners.addEmail.success"));
                queryClient.invalidateQueries({
                    queryKey: getOwnerControllerGetOwnersQueryKey(),
                });
                onOpenChange(false);
                form.reset();
                onSuccess?.();
            },
            onError: showApiError,
        },
    });

    const form = useForm<AddOwnerEmailValues>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: "" },
    });

    const onSubmit = (values: AddOwnerEmailValues) => {
        if (!owner) return;
        setOwnerEmail.mutate({
            ownerId: owner.id,
            data: { email: values.email },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("owners.addEmail.title")}</DialogTitle>
                    <DialogDescription>
                        {t("owners.addEmail.description", {
                            name: owner?.displayName ?? "",
                        })}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormInput
                            name="email"
                            label={t("owners.addEmail.emailLabel")}
                            type="email"
                        />
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={setOwnerEmail.isPending}
                            >
                                {setOwnerEmail.isPending
                                    ? t("owners.addEmail.submitting")
                                    : t("owners.addEmail.submit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
