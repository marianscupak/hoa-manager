import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
import {
    getUnitControllerGetUnitsQueryKey,
    useUnitControllerCreateUnit,
} from "@/api/generated/property-units/property-units";

const createUnitSchema = z.object({
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

type CreateUnitValues = z.infer<typeof createUnitSchema>;

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

    const form = useForm<CreateUnitValues>({
        resolver: zodResolver(createUnitSchema) as unknown as Resolver<
            CreateUnitValues,
            unknown
        >,
        defaultValues: {
            unitNo: "",
            buildingShareNumerator: 1,
            buildingShareDenominator: 1,
        },
    });

    const onSubmit = (values: CreateUnitValues) => {
        createUnit.mutate({
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
                        <FormField<CreateUnitValues>
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
                                <FormField<CreateUnitValues>
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
                                <FormField<CreateUnitValues>
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
