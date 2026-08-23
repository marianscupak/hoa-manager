import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
    formatFraction,
    fractionEqualsOne,
    sumFractions,
    toast,
    type Fraction,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import type { UnitOwnershipResponseDto } from "@/api/generated/model";
import { useOwnerControllerGetOwners } from "@/api/generated/property-owners/property-owners";
import {
    getUnitControllerGetUnitDetailQueryKey,
    getUnitControllerGetUnitsQueryKey,
    useUnitControllerReplaceUnitOwnership,
} from "@/api/generated/property-units/property-units";

import { ReplaceOwnershipFieldItem } from "./field-item";
import { replaceOwnershipSchema, ReplaceOwnershipValues } from "./schema";

interface ReplaceOwnershipDialogProps {
    unitId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentOwnerships?: UnitOwnershipResponseDto[];
    onSuccess?: () => void;
}

const emptyRow = (): ReplaceOwnershipValues["ownerships"][number] => ({
    partyType: "SOLE",
    share: null,
    memberOwnerIds: [""],
});

export function ReplaceOwnershipDialog({
    unitId,
    open,
    onOpenChange,
    currentOwnerships,
    onSuccess,
}: ReplaceOwnershipDialogProps) {
    const { t } = useTranslation(["admin"]);
    const schema = useMemo(() => replaceOwnershipSchema(t), [t]);
    const queryClient = useQueryClient();

    const { data: owners } = useOwnerControllerGetOwners();
    const replaceOwnership = useUnitControllerReplaceUnitOwnership();

    const form = useForm<ReplaceOwnershipValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            ownerships: [emptyRow()],
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
                    partyType: o.partyType,
                    share: { num: o.shareNumerator, den: o.shareDenominator },
                    memberOwnerIds: o.members.map((m) => m.ownerId),
                })),
            });
        } else if (open) {
            form.reset({
                ownerships: [emptyRow()],
            });
        }
    }, [open, currentOwnerships, form]);

    const onSubmit = (values: ReplaceOwnershipValues) => {
        replaceOwnership.mutate(
            {
                id: unitId,
                data: {
                    ownerships: values.ownerships.map((o) => ({
                        partyType: o.partyType,
                        shareNumerator: (o.share as Fraction).num,
                        shareDenominator: (o.share as Fraction).den,
                        memberOwnerIds: o.memberOwnerIds,
                    })),
                },
            },
            {
                onSuccess: () => {
                    toast.success(t("units.ownershipEditor.success"));
                    queryClient.invalidateQueries({
                        queryKey:
                            getUnitControllerGetUnitDetailQueryKey(unitId),
                    });
                    queryClient.invalidateQueries({
                        queryKey: getUnitControllerGetUnitsQueryKey(),
                    });
                    onOpenChange(false);
                    onSuccess?.();
                },
                onError: showApiError,
            },
        );
    };

    const watchedOwnerships = form.watch("ownerships");
    const sum = useMemo(
        () =>
            sumFractions(
                watchedOwnerships
                    .map((o) => o.share)
                    .filter((s): s is Fraction => s !== null),
            ),
        [watchedOwnerships],
    );
    const sumIsExact = fractionEqualsOne(sum);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
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
                                    owners={owners ?? []}
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
                                onClick={() => append(emptyRow())}
                            >
                                <PlusIcon className="mr-2 h-4 w-4" />
                                {t("units.ownershipEditor.addOwner")}
                            </Button>

                            <div className="text-right text-sm font-medium">
                                <span className="text-muted-foreground">
                                    {t("units.ownershipEditor.totalShare")}:{" "}
                                </span>
                                <span
                                    className={
                                        sumIsExact
                                            ? "text-success"
                                            : "text-warning"
                                    }
                                >
                                    {sumIsExact
                                        ? `Σ = ${formatFraction(sum)}`
                                        : t("units.ownershipEditor.sumHint", {
                                              sum: formatFraction(sum),
                                          })}
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
