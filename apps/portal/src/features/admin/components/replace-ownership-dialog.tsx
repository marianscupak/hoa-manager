import { zodResolver } from "@hookform/resolvers/zod";
import { TFunction } from "i18next";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { useOwnerControllerGetOwners } from "@/api/generated/property-owners/property-owners";
import { useUnitControllerReplaceUnitOwnership } from "@/api/generated/property-units/property-units";

const replaceOwnershipSchema = (t: TFunction<"admin">) =>
    z.object({
        ownerships: z
            .array(
                z.object({
                    ownerId: z
                        .string()
                        .min(1, t("units.ownershipEditor.ownerLabel")),
                    share: z
                        .string()
                        .regex(
                            /^\d+(\.\d+)?$/,
                            t("units.ownershipEditor.invalidShareError"),
                        ),
                }),
            )
            .min(1)
            .refine(
                (items) => {
                    const total = items.reduce(
                        (acc, item) => acc + parseFloat(item.share || "0"),
                        0,
                    );
                    return Math.abs(total - 1.0) < 0.0001;
                },
                { message: t("units.ownershipEditor.sumError") },
            )
            .refine(
                (items) => {
                    const ids = items.map((i) => i.ownerId);
                    return new Set(ids).size === ids.length;
                },
                { message: t("units.ownershipEditor.duplicateError") },
            ),
    });

type ReplaceOwnershipValues = z.infer<
    ReturnType<typeof replaceOwnershipSchema>
>;

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
                                <div
                                    key={field.id}
                                    className="border-border bg-muted/60 flex items-start gap-4 rounded-xl border p-4 transition-colors hover:border-slate-300"
                                >
                                    <div className="flex-1">
                                        <FormSelect
                                            name={`ownerships.${index}.ownerId`}
                                            label={t(
                                                "units.ownershipEditor.ownerLabel",
                                            )}
                                            placeholder={t(
                                                "units.ownershipEditor.ownerPlaceholder",
                                            )}
                                            options={ownerOptions}
                                        />
                                    </div>

                                    <div className="w-32">
                                        <FormInput
                                            name={`ownerships.${index}.share`}
                                            label={t(
                                                "units.ownershipEditor.shareLabel",
                                            )}
                                            placeholder="0.5"
                                        />
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="mt-5 text-slate-500 hover:text-red-500"
                                        onClick={() => remove(index)}
                                        disabled={fields.length <= 1}
                                    >
                                        <Trash2Icon className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {form.formState.errors.ownerships?.root && (
                            <p className="text-sm font-medium text-red-500">
                                {form.formState.errors.ownerships.root.message}
                            </p>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
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
                                <span className="text-slate-500">
                                    {t("units.ownershipEditor.totalShare")}:{" "}
                                </span>
                                <span
                                    className={
                                        Math.abs(totalShare - 1.0) < 0.0001
                                            ? "text-green-600"
                                            : "text-red-600"
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
