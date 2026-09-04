import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FractionInput,
    Input,
    toast,
    type Fraction,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import type { UnitResponseDto } from "@/api/generated/model";
import {
    getUnitControllerGetUnitDetailQueryKey,
    getUnitControllerGetUnitsQueryKey,
    useUnitControllerUpdateUnit,
} from "@/api/generated/property-units/property-units";

import { unitFormSchema, type UnitFormValues } from "./unit-form-schema";

interface UpdateUnitDialogProps {
    unit?: UnitResponseDto | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function UpdateUnitDialog({
    unit,
    open,
    onOpenChange,
    onSuccess,
}: UpdateUnitDialogProps) {
    const { t } = useTranslation(["admin", "common"]);
    const queryClient = useQueryClient();

    const updateUnit = useUnitControllerUpdateUnit({
        mutation: {
            onSuccess: () => {
                toast.success(t("units.update.success"));
                queryClient.invalidateQueries({
                    queryKey: getUnitControllerGetUnitsQueryKey(),
                });
                if (unit?.id) {
                    queryClient.invalidateQueries({
                        queryKey: getUnitControllerGetUnitDetailQueryKey(
                            unit.id,
                        ),
                    });
                }
                onOpenChange(false);
                onSuccess?.();
            },
            onError: showApiError,
        },
    });

    const form = useForm<UnitFormValues>({
        resolver: zodResolver(unitFormSchema),
        defaultValues: {
            unitNo: "",
            buildingShare: { num: 1, den: 1 },
        },
    });

    useEffect(() => {
        if (unit) {
            form.reset({
                unitNo: unit.unitNo,
                buildingShare: {
                    num: unit.buildingShareNumerator,
                    den: unit.buildingShareDenominator,
                },
            });
        }
    }, [unit, form]);

    const onSubmit = (values: UnitFormValues) => {
        if (!unit) return;
        const share = values.buildingShare as Fraction;
        updateUnit.mutate({
            id: unit.id,
            data: {
                unitNo: values.unitNo,
                buildingShareNumerator: share.num,
                buildingShareDenominator: share.den,
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("units.update.title")}</DialogTitle>
                    <DialogDescription>
                        {t("units.create.description")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="unitNo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("units.create.unitNoLabel")}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t(
                                                "units.create.unitNoPlaceholder",
                                            )}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="buildingShare"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("units.create.buildingShareLabel")}
                                    </FormLabel>
                                    <FractionInput
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder={t(
                                            "units.create.buildingSharePlaceholder",
                                        )}
                                        aria-invalid={!!fieldState.error}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={updateUnit.isPending}
                            >
                                {updateUnit.isPending
                                    ? t("units.create.submitting")
                                    : t("common:save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
