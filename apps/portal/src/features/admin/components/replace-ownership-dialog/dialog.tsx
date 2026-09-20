import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { format, startOfDay } from "date-fns";
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
    HelpHint,
    DialogTitle,
    Form,
    FormDatePicker,
    formatFraction,
    fractionEqualsOne,
    sumFractions,
    toast,
    type Fraction,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import type { UnitOwnershipResponseDto } from "@/api/generated/model";
import { useOwnerControllerGetOwners } from "@/api/generated/property-owners/property-owners";
import { useUnitControllerReplaceUnitOwnership } from "@/api/generated/property-units/property-units";
import { invalidateUnitOwnershipQueries } from "@/features/admin/components/ownership-history/invalidate-ownership-queries";

import { ReplaceOwnershipFieldItem } from "./field-item";
import { emptyRow, initialRows } from "./rows";
import { replaceOwnershipSchema, ReplaceOwnershipValues } from "./schema";

interface ReplaceOwnershipDialogProps {
    unitId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentOwnerships?: UnitOwnershipResponseDto[];
    /** Start of the latest ownership period; earlier dates are refused. */
    minEffectiveFrom?: Date;
    onSuccess?: () => void;
}

export function ReplaceOwnershipDialog({
    unitId,
    open,
    onOpenChange,
    currentOwnerships,
    minEffectiveFrom,
    onSuccess,
}: ReplaceOwnershipDialogProps) {
    const { t } = useTranslation(["admin"]);
    const schema = useMemo(
        () => replaceOwnershipSchema(t, minEffectiveFrom),
        [t, minEffectiveFrom],
    );
    const queryClient = useQueryClient();

    const { data: owners } = useOwnerControllerGetOwners();
    const replaceOwnership = useUnitControllerReplaceUnitOwnership();

    const form = useForm<ReplaceOwnershipValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            effectiveFrom: startOfDay(new Date()),
            ownerships: initialRows(currentOwnerships),
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "ownerships",
    });

    useEffect(() => {
        if (open)
            form.reset({
                effectiveFrom: startOfDay(new Date()),
                ownerships: initialRows(currentOwnerships),
            });
    }, [open, currentOwnerships, form]);

    const onSubmit = (values: ReplaceOwnershipValues) => {
        replaceOwnership.mutate(
            {
                id: unitId,
                data: {
                    effectiveFrom: format(values.effectiveFrom, "yyyy-MM-dd"),
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
                    invalidateUnitOwnershipQueries(queryClient, unitId);
                    onOpenChange(false);
                    onSuccess?.();
                },
                onError: showApiError,
            },
        );
    };

    // Deliberately not memoised: react-hook-form mutates the watched array in
    // place when a share changes, so its reference only changes when a row is
    // added or removed. A memo keyed on it froze this sum between those
    // events, which is exactly the "sum doesn't update live" report.
    const watchedOwnerships = form.watch("ownerships");
    const sum = sumFractions(
        watchedOwnerships
            .map((o) => o.share)
            .filter((s): s is Fraction => s !== null),
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
                        <FormDatePicker
                            name="effectiveFrom"
                            label={t(
                                "units.ownershipEditor.effectiveFromLabel",
                            )}
                            description={t(
                                "units.ownershipEditor.effectiveFromHint",
                            )}
                            min={minEffectiveFrom}
                            className="max-w-xs"
                        />

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
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append(emptyRow())}
                                >
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    {t("units.ownershipEditor.addOwner")}
                                </Button>

                                {/* Three of six participants in the usability
                                    study got the ownership type wrong: two
                                    reached for SJM to put siblings on one
                                    unit, because it was the only visible way
                                    to name two people, and one never found it
                                    for an actual married couple. The rule is
                                    one entry per co-owner, with SJM as the
                                    exception — so it is spelled out right
                                    where a second co-owner is added. */}
                                <HelpHint
                                    showLabel
                                    label={t(
                                        "units.ownershipEditor.help.label",
                                    )}
                                >
                                    <p>
                                        {/* The button's own label, so the
                                            hint cannot drift from what the
                                            button actually says. */}
                                        {t("units.ownershipEditor.help.party", {
                                            button: t(
                                                "units.ownershipEditor.addOwner",
                                            ),
                                        })}
                                    </p>
                                    <p>{t("units.ownershipEditor.help.sjm")}</p>
                                    <p className="text-muted-foreground">
                                        {t("units.ownershipEditor.help.sum")}
                                    </p>
                                </HelpHint>
                            </div>

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
