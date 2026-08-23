import { TFunction } from "i18next";
import { z } from "zod";

import { fractionEqualsOne, sumFractions, type Fraction } from "@hoa-mngr/ui";

const fractionSchema = (t: TFunction<"admin">) =>
    z
        .object(
            {
                num: z.number().int().min(1),
                den: z.number().int().min(1),
            },
            { message: t("units.ownershipEditor.invalidShareError") },
        )
        .nullable()
        // Explicit `: boolean` return type prevents TS 5.5's automatic type
        // predicate inference (`v is Fraction`) from narrowing `null` out of
        // this schema's inferred output type — the field must stay
        // `Fraction | null` so `useForm`'s live (pre-submit) values can hold
        // `null` for an unfilled share.
        .refine((v): boolean => v !== null, {
            message: t("units.ownershipEditor.invalidShareError"),
        });

export const replaceOwnershipSchema = (t: TFunction<"admin">) =>
    z.object({
        ownerships: z
            .array(
                z
                    .object({
                        partyType: z.enum(["SOLE", "SJM"]),
                        share: fractionSchema(t),
                        memberOwnerIds: z
                            .array(
                                z
                                    .string()
                                    .min(
                                        1,
                                        t(
                                            "units.ownershipEditor.ownerRequiredError",
                                        ),
                                    ),
                            )
                            .min(1)
                            .max(2),
                    })
                    .refine(
                        (p) =>
                            p.partyType === "SOLE"
                                ? p.memberOwnerIds.length === 1
                                : p.memberOwnerIds.length === 2 &&
                                  p.memberOwnerIds[0] !== p.memberOwnerIds[1],
                        {
                            message: t("units.ownershipEditor.membersError"),
                            path: ["memberOwnerIds"],
                        },
                    ),
            )
            .min(1)
            .refine(
                (items) => {
                    const shares = items.map((i) => i.share);
                    if (shares.some((s) => s === null)) return true;
                    return fractionEqualsOne(
                        sumFractions(shares as Fraction[]),
                    );
                },
                { message: t("units.ownershipEditor.sumError") },
            )
            .refine(
                (items) => {
                    const ids = items.flatMap((i) => i.memberOwnerIds);
                    return new Set(ids).size === ids.length;
                },
                { message: t("units.ownershipEditor.duplicateError") },
            ),
    });

export type ReplaceOwnershipValues = z.infer<
    ReturnType<typeof replaceOwnershipSchema>
>;
