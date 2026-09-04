import { z } from "zod";

/**
 * Shared by the create and update unit dialogs. The building share is a
 * single `Fraction` (typed through `FractionInput`) rather than two integer
 * fields, and stays `null` while blank so the form can hold an unfilled
 * value before submit. Error messages are i18n keys resolved by
 * `FormMessage`.
 */
export const unitFormSchema = z.object({
    unitNo: z.string().min(1, "admin:units.create.unitNoRequired").max(50),
    buildingShare: z
        .object({
            num: z.number().int().min(1),
            den: z.number().int().min(1),
        })
        .nullable()
        .refine((v): boolean => v !== null, {
            message: "admin:units.create.shareInvalid",
        }),
});

export type UnitFormValues = z.infer<typeof unitFormSchema>;
