import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
import {
    getUnitControllerGetUnitsQueryKey,
    useUnitControllerCreateUnit,
} from "@/api/generated/property-units/property-units";

import { unitFormSchema, type UnitFormValues } from "./unit-form-schema";

interface CreateUnitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateUnitDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateUnitDialogProps) {
    const { t } = useTranslation(["admin"]);
    const queryClient = useQueryClient();

    const createUnit = useUnitControllerCreateUnit({
        mutation: {
            onSuccess: () => {
                toast.success(t("units.create.success"));
                queryClient.invalidateQueries({
                    queryKey: getUnitControllerGetUnitsQueryKey(),
                });
                onOpenChange(false);
                form.reset();
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

    const onSubmit = (values: UnitFormValues) => {
        const share = values.buildingShare as Fraction;
        createUnit.mutate({
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
                    <DialogTitle>{t("units.create.title")}</DialogTitle>
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
                                disabled={createUnit.isPending}
                            >
                                {createUnit.isPending
                                    ? t("units.create.submitting")
                                    : t("units.create.submit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
