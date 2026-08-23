import { Trash2Icon } from "lucide-react";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
    Button,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormSelect,
    FractionInput,
} from "@hoa-mngr/ui";

import type { OwnerResponseDto } from "@/api/generated/model";

import type { ReplaceOwnershipValues } from "./schema";

interface ReplaceOwnershipFieldItemProps {
    index: number;
    owners: OwnerResponseDto[];
    onRemove: (index: number) => void;
    canRemove: boolean;
}

export function ReplaceOwnershipFieldItem({
    index,
    owners,
    onRemove,
    canRemove,
}: ReplaceOwnershipFieldItemProps) {
    const { t } = useTranslation(["admin"]);
    const { control, setValue, getValues, formState } =
        useFormContext<ReplaceOwnershipValues>();

    const partyType = useWatch({
        control,
        name: `ownerships.${index}.partyType`,
    });

    // The per-party `memberOwnerIds` refine (schema.ts) attaches its error
    // directly to `ownerships.<index>.memberOwnerIds` (unlike the top-level
    // `ownerships` field-array, whose own custom-refine errors nest under
    // `.root` — `memberOwnerIds` isn't itself a `useFieldArray`, just a plain
    // array value, so it doesn't get that treatment). Neither the `share`
    // FormField nor the `memberOwnerIds.0`/`.1` FormSelects read this path,
    // so without reading it explicitly here, a duplicate/invalid member
    // selection fails validation with no visible feedback at all.
    const membersError =
        formState.errors.ownerships?.[index]?.memberOwnerIds?.message;

    const ownerOptions = useMemo(
        () => owners.map((o) => ({ label: o.displayName, value: o.id })),
        [owners],
    );
    const personOptions = useMemo(
        () =>
            owners
                .filter((o) => o.kind === "PERSON")
                .map((o) => ({ label: o.displayName, value: o.id })),
        [owners],
    );

    const handlePartyTypeChange = (value: string) => {
        const current = getValues(`ownerships.${index}.memberOwnerIds`);
        setValue(
            `ownerships.${index}.memberOwnerIds`,
            value === "SJM"
                ? [current[0] ?? "", current[1] ?? ""]
                : [current[0] ?? ""],
        );
    };

    return (
        <div className="border-border bg-muted/60 hover:border-primary/30 space-y-4 rounded-xl border p-4 transition-colors">
            <div className="flex items-start gap-4">
                <div className="w-44">
                    <FormSelect
                        name={`ownerships.${index}.partyType`}
                        label={t("units.ownershipEditor.partyType.label")}
                        options={[
                            {
                                label: t(
                                    "units.ownershipEditor.partyType.sole",
                                ),
                                value: "SOLE",
                            },
                            {
                                label: t("units.ownershipEditor.partyType.sjm"),
                                value: "SJM",
                            },
                        ]}
                        onValueChange={handlePartyTypeChange}
                    />
                </div>

                <div className="w-36">
                    <FormField
                        control={control}
                        name={`ownerships.${index}.share`}
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormLabel>
                                    {t("units.ownershipEditor.shareLabel")}
                                </FormLabel>
                                <FractionInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    aria-invalid={!!fieldState.error}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive mt-7"
                    onClick={() => onRemove(index)}
                    disabled={!canRemove}
                >
                    <Trash2Icon className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {partyType === "SJM" ? (
                    <>
                        <FormSelect
                            name={`ownerships.${index}.memberOwnerIds.0`}
                            label={t("units.ownershipEditor.spouseOne")}
                            placeholder={t(
                                "units.ownershipEditor.ownerPlaceholder",
                            )}
                            options={personOptions}
                        />
                        <FormSelect
                            name={`ownerships.${index}.memberOwnerIds.1`}
                            label={t("units.ownershipEditor.spouseTwo")}
                            placeholder={t(
                                "units.ownershipEditor.ownerPlaceholder",
                            )}
                            options={personOptions}
                        />
                    </>
                ) : (
                    <FormSelect
                        name={`ownerships.${index}.memberOwnerIds.0`}
                        label={t("units.ownershipEditor.ownerLabel")}
                        placeholder={t(
                            "units.ownershipEditor.ownerPlaceholder",
                        )}
                        options={ownerOptions}
                    />
                )}
            </div>

            {membersError && (
                <p className="text-destructive text-[0.8rem] font-medium">
                    {membersError}
                </p>
            )}
        </div>
    );
}
