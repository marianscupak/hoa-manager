import { TFunction } from "i18next";
import { z } from "zod";

export const replaceOwnershipSchema = (t: TFunction<"admin">) =>
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

export type ReplaceOwnershipValues = z.infer<
    ReturnType<typeof replaceOwnershipSchema>
>;
