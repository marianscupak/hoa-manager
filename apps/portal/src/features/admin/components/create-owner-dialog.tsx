import { zodResolver } from "@hookform/resolvers/zod";
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

import { useOwnerControllerCreateOwner } from "@/api/generated/property-owners/property-owners";

const ownerSchema = z.object({
    displayName: z.string().min(1, "admin:owners.create.required"),
    email: z.email().or(z.literal("")).optional(),
});

type CreateOwnerValues = z.infer<typeof ownerSchema>;

interface CreateOwnerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateOwnerDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateOwnerDialogProps) {
    const { t } = useTranslation(["admin"]);

    const createOwner = useOwnerControllerCreateOwner({
        mutation: {
            onSuccess: () => {
                toast.success(t("owners.create.success"));
                onOpenChange(false);
                form.reset();
                onSuccess?.();
            },
            onError: () => {
                toast.error(t("owners.create.error"));
            },
        },
    });

    const form = useForm<CreateOwnerValues>({
        resolver: zodResolver(ownerSchema),
        defaultValues: {
            displayName: "",
            email: "",
        },
    });

    const onSubmit = (values: CreateOwnerValues) => {
        createOwner.mutate({
            data: {
                displayName: values.displayName,
                ...(values.email ? { email: values.email } : {}),
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("owners.create.title")}</DialogTitle>
                    <DialogDescription>
                        {t("owners.create.description")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormInput
                            name="displayName"
                            label={t("owners.create.displayNameLabel")}
                            placeholder={t(
                                "owners.create.displayNamePlaceholder",
                            )}
                        />
                        <FormInput
                            name="email"
                            label={t("owners.create.emailLabel")}
                            type="email"
                            placeholder={t("owners.create.emailPlaceholder")}
                        />
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={createOwner.isPending}
                            >
                                {createOwner.isPending
                                    ? t("owners.create.submitting")
                                    : t("owners.create.submit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
