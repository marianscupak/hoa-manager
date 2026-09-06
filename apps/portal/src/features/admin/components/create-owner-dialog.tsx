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
    FormSelect,
    toast,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import type { CreateOwnerDtoKind } from "@/api/generated/model";
import {
    getOwnerControllerGetOwnersQueryKey,
    useOwnerControllerCreateOwner,
} from "@/api/generated/property-owners/property-owners";

const ownerSchema = z.object({
    displayName: z.string().min(1, "admin:owners.create.required"),
    email: z.string().email().or(z.literal("")).optional(),
    kind: z.enum(["PERSON", "LEGAL_ENTITY", "ASSOCIATION"]),
});

type CreateOwnerValues = z.infer<typeof ownerSchema>;

interface CreateOwnerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    /** Seeds the name field, e.g. with what was typed into an owner picker. */
    defaultName?: string;
    /**
     * Fixes the kind and hides its picker. Set it where only one kind can be
     * used, so the dialog cannot produce an owner the caller then has to
     * reject — an SJM spouse field, for instance, only ever lists people.
     */
    lockedKind?: CreateOwnerDtoKind;
    /**
     * Called once the owner exists *and* the owner list has been refreshed,
     * so a caller may select the new owner straight away.
     */
    onCreated?: (ownerId: string) => void;
}

export function CreateOwnerDialog({
    open,
    onOpenChange,
    onSuccess,
    defaultName,
    lockedKind,
    onCreated,
}: CreateOwnerDialogProps) {
    const { t } = useTranslation(["admin"]);
    const queryClient = useQueryClient();

    const createOwner = useOwnerControllerCreateOwner({
        mutation: {
            onSuccess: async ({ ownerId }) => {
                toast.success(t("owners.create.success"));
                // Awaited so `onCreated` runs against a list that already
                // holds the new owner; a caller selecting it otherwise sets a
                // value none of its options match yet.
                await queryClient.invalidateQueries({
                    queryKey: getOwnerControllerGetOwnersQueryKey(),
                });
                onSuccess?.();
                // Reported before the dialog closes: a caller that clears its
                // own state on close would otherwise be asked to act on an
                // owner it no longer knows what to do with.
                onCreated?.(ownerId);
                onOpenChange(false);
                form.reset();
            },
            onError: showApiError,
        },
    });

    const form = useForm<CreateOwnerValues>({
        resolver: zodResolver(ownerSchema),
        defaultValues: {
            displayName: defaultName ?? "",
            email: "",
            kind: lockedKind ?? "PERSON",
        },
    });

    useEffect(() => {
        if (open)
            form.reset({
                displayName: defaultName ?? "",
                email: "",
                kind: lockedKind ?? "PERSON",
            });
    }, [open, defaultName, lockedKind, form]);

    const onSubmit = (values: CreateOwnerValues) => {
        createOwner.mutate({
            data: {
                displayName: values.displayName,
                kind: values.kind,
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
                        onSubmit={(event) => {
                            // The dialog is portalled out of the DOM, but a
                            // React event still travels up the *component*
                            // tree — so opening this from inside another form
                            // (the ownership editor) would submit that one
                            // too. Stopped here rather than at every caller.
                            event.stopPropagation();
                            void form.handleSubmit(onSubmit)(event);
                        }}
                        className="space-y-4"
                    >
                        <FormInput
                            name="displayName"
                            label={t("owners.create.displayNameLabel")}
                            placeholder={t(
                                "owners.create.displayNamePlaceholder",
                            )}
                        />
                        {!lockedKind && (
                            <FormSelect
                                name="kind"
                                label={t("owners.kind.label")}
                                options={[
                                    {
                                        label: t("owners.kind.person"),
                                        value: "PERSON",
                                    },
                                    {
                                        label: t("owners.kind.legalEntity"),
                                        value: "LEGAL_ENTITY",
                                    },
                                    {
                                        label: t("owners.kind.association"),
                                        value: "ASSOCIATION",
                                    },
                                ]}
                            />
                        )}
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
