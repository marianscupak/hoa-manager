import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Form,
    toast,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import { useOwnerControllerGetOwners } from "@/api/generated/property-owners/property-owners";
import { useUnitControllerReplaceUnitOwnership } from "@/api/generated/property-units/property-units";

import { ReplaceOwnershipFieldItem } from "./field-item";
import { replaceOwnershipSchema, ReplaceOwnershipValues } from "./schema";

interface ReplaceOwnershipDialogProps {
    unitId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentOwnerships?: { ownerId: string; share: string }[];
    onSuccess?: () => void;
}

export function ReplaceOwnershipDialog({
    unitId,
    open,
    onOpenChange,
    currentOwnerships,
    onSuccess,
}: ReplaceOwnershipDialogProps) {
    const { t } = useTranslation(["admin"]);
    const schema = useMemo(() => replaceOwnershipSchema(t), [t]);

    const { data: owners } = useOwnerControllerGetOwners();
    const replaceOwnership = useUnitControllerReplaceUnitOwnership();

    const form = useForm<ReplaceOwnershipValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            ownerships: [{ ownerId: "", share: "1.0" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "ownerships",
    });

    useEffect(() => {
        if (open && currentOwnerships && currentOwnerships.length > 0) {
            form.reset({
                ownerships: currentOwnerships.map((o) => ({
                    ownerId: o.ownerId,
                    share: o.share,
                })),
            });
        } else if (open) {
            form.reset({
                ownerships: [{ ownerId: "", share: "1.0" }],
            });
        }
    }, [open, currentOwnerships, form]);

    const onSubmit = (values: ReplaceOwnershipValues) => {
        replaceOwnership.mutate(
            {
                id: unitId,
                data: {
                    ownerships: values.ownerships.map((o) => ({
                        ownerId: o.ownerId,
                        share: o.share,
                    })),
                },
            },
            {
                onSuccess: () => {
                    toast.success(t("units.ownershipEditor.success"));
                    onOpenChange(false);
                    onSuccess?.();
                },
                onError: showApiError,
            },
        );
    };

    const ownerOptions = useMemo(
        () =>
            owners?.map((owner) => ({
                label: owner.displayName,
                value: owner.id,
            })) ?? [],
        [owners],
    );

    const totalShare = fields.reduce(
        (acc, _, i) =>
            acc + parseFloat(form.getValues(`ownerships.${i}.share`) || "0"),
        0,
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {t("units.ownershipEditor.title")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("units.ownershipEditor.description")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <ReplaceOwnershipFieldItem
                                    key={field.id}
                                    index={index}
                                    ownerOptions={ownerOptions}
                                    onRemove={remove}
                                    canRemove={fields.length > 1}
                                />
                            ))}
                        </div>

                        {form.formState.errors.ownerships?.root && (
                            <p className="text-destructive text-sm font-medium">
                                {form.formState.errors.ownerships.root.message}
                            </p>
                        )}

                        <div className="flex items-center justify-between border-t pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    append({ ownerId: "", share: "0" })
                                }
                            >
                                <PlusIcon className="mr-2 h-4 w-4" />
                                {t("units.ownershipEditor.addOwner")}
                            </Button>

                            <div className="text-sm font-medium">
                                <span className="text-muted-foreground">
                                    {t("units.ownershipEditor.totalShare")}:{" "}
                                </span>
                                <span
                                    className={
                                        Math.abs(totalShare - 1.0) < 0.0001
                                            ? "text-success"
                                            : "text-destructive"
                                    }
                                >
                                    {totalShare.toFixed(4)}
                                </span>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={replaceOwnership.isPending}
                                className="w-full sm:w-auto"
                            >
                                {replaceOwnership.isPending
                                    ? t("units.ownershipEditor.saving")
                                    : t("units.ownershipEditor.save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
