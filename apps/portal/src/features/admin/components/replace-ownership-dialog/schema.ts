import { startOfDay } from "date-fns";
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

export const replaceOwnershipSchema = (
    t: TFunction<"admin">,
    /** Start of the unit's latest period; the picker must not go before it. */
    minEffectiveFrom?: Date,
) =>
    z.object({
        effectiveFrom: z
            .date({ message: t("units.ownershipEditor.effectiveFromRequired") })
            .refine(
                (d) =>
                    !minEffectiveFrom ||
                    startOfDay(d).getTime() >=
                        startOfDay(minEffectiveFrom).getTime(),
                { message: t("units.ownershipEditor.effectiveFromTooEarly") },
            ),
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
                        (p) => {
                            if (p.partyType === "SOLE") {
                                return p.memberOwnerIds.length === 1;
                            }
                            if (p.memberOwnerIds.length !== 2) return false;
                            const [first, second] = p.memberOwnerIds;
                            // Two slots nobody has picked yet are not "the
                            // same member" — the per-slot required rule
                            // already reports them.
                            if (!first || !second) return true;
                            return first !== second;
                        },
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
                    // Blank slots are placeholders, not owners; counting them
                    // made every second unfilled row look like a duplicate.
                    const ids = items
                        .flatMap((i) => i.memberOwnerIds)
                        .filter((id) => id !== "");
                    return new Set(ids).size === ids.length;
                },
                { message: t("units.ownershipEditor.duplicateError") },
            ),
    });

export type ReplaceOwnershipValues = z.infer<
    ReturnType<typeof replaceOwnershipSchema>
>;
