import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Resolver, useForm } from "react-hook-form";
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
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Input,
    toast,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import type { UnitResponseDto } from "@/api/generated/model";
import {
    getUnitControllerGetUnitDetailQueryKey,
    getUnitControllerGetUnitsQueryKey,
    useUnitControllerUpdateUnit,
} from "@/api/generated/property-units/property-units";

const updateUnitSchema = z.object({
    unitNo: z.string().min(1, "units.create.unitNoRequired").max(50),
    buildingShareNumerator: z.preprocess(
        (v) => (v === "" ? undefined : Number(v)),
        z
            .number()
            .int("units.create.shareMustBePositive")
            .positive("units.create.shareMustBePositive"),
    ),
    buildingShareDenominator: z.preprocess(
        (v) => (v === "" ? undefined : Number(v)),
        z
            .number()
            .int("units.create.shareMustBePositive")
            .positive("units.create.shareMustBePositive"),
    ),
});

type UpdateUnitValues = z.infer<typeof updateUnitSchema>;

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

    const form = useForm<UpdateUnitValues>({
        resolver: zodResolver(updateUnitSchema) as unknown as Resolver<
            UpdateUnitValues,
            unknown
        >,
        defaultValues: {
            unitNo: "",
            buildingShareNumerator: 1,
            buildingShareDenominator: 1,
        },
    });

    useEffect(() => {
        if (unit) {
            form.reset({
                unitNo: unit.unitNo,
                buildingShareNumerator: unit.buildingShareNumerator,
                buildingShareDenominator: unit.buildingShareDenominator,
            });
        }
    }, [unit, form]);

    const onSubmit = (values: UpdateUnitValues) => {
        if (!unit) return;
        updateUnit.mutate({
            id: unit.id,
            data: {
                unitNo: values.unitNo,
                buildingShareNumerator: values.buildingShareNumerator,
                buildingShareDenominator: values.buildingShareDenominator,
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
                        <FormField<UpdateUnitValues>
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
                        <div>
                            <FormLabel>
                                {t("units.create.buildingShareLabel")}
                            </FormLabel>
                            <div className="mt-2 flex items-center gap-2">
                                <FormField<UpdateUnitValues>
                                    control={form.control}
                                    name="buildingShareNumerator"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    step={1}
                                                    placeholder={t(
                                                        "units.create.numeratorPlaceholder",
                                                    )}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <span className="text-muted-foreground text-lg font-semibold">
                                    /
                                </span>
                                <FormField<UpdateUnitValues>
                                    control={form.control}
                                    name="buildingShareDenominator"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    step={1}
                                                    placeholder={t(
                                                        "units.create.denominatorPlaceholder",
                                                    )}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
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
