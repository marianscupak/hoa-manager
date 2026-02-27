import { zodResolver } from "@hookform/resolvers/zod";
import { TFunction } from "i18next";
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
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Input,
    toast,
} from "@hoa-mngr/ui";

import { useUnitControllerCreateUnit } from "@/api/generated/property-units/property-units";

const createUnitSchema = (t: TFunction<"admin">) =>
    z.object({
        unitNo: z.string().min(1, t("units.create.unitNoRequired")).max(50),
        buildingShare: z
            .string()
            .regex(/^\d+(\.\d+)?$/, t("units.create.buildingShareRequired")),
    });

type CreateUnitValues = z.infer<ReturnType<typeof createUnitSchema>>;

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
    const schema = createUnitSchema(t);

    const createUnit = useUnitControllerCreateUnit({
        mutation: {
            onSuccess: () => {
                toast.success(t("units.create.success"));
                onOpenChange(false);
                form.reset();
                onSuccess?.();
            },
            onError: () => {
                toast.error(t("units.create.error"));
            },
        },
    });

    const form = useForm<CreateUnitValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            unitNo: "",
            buildingShare: "",
        },
    });

    const onSubmit = (values: CreateUnitValues) => {
        createUnit.mutate({ data: values });
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
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("units.create.buildingShareLabel")}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t(
                                                "units.create.buildingSharePlaceholder",
                                            )}
                                            {...field}
                                        />
                                    </FormControl>
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
