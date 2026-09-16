import { Trash2Icon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
    Button,
    FormCombobox,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormSelect,
    FractionInput,
} from "@hoa-mngr/ui";

import type {
    CreateOwnerDtoKind,
    OwnerResponseDto,
} from "@/api/generated/model";

import { CreateOwnerDialog } from "../create-owner-dialog";

import type { ReplaceOwnershipValues } from "./schema";

/** Which member slot asked for a new owner, and what kind it may be. */
interface PendingOwner {
    slot: 0 | 1;
    name: string;
    lockedKind?: CreateOwnerDtoKind;
}

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
    const [pendingOwner, setPendingOwner] = useState<PendingOwner | null>(null);
    // Which slot is waiting for the new owner. Kept in a ref as well as in
    // state because the answer is needed after a round-trip to the server, by
    // which point a re-render may already have closed the dialog.
    const pendingSlot = useRef<0 | 1 | null>(null);

    const startCreatingOwner = (pending: PendingOwner) => {
        pendingSlot.current = pending.slot;
        setPendingOwner(pending);
    };

    const partyType = useWatch({
        control,
        name: `ownerships.${index}.partyType`,
    });

    // The per-party `memberOwnerIds` refine (schema.ts) attaches its error
    // directly to `ownerships.<index>.memberOwnerIds` (unlike the top-level
    // `ownerships` field-array, whose own custom-refine errors nest under
    // `.root` — `memberOwnerIds` isn't itself a `useFieldArray`, just a plain
    // array value, so it doesn't get that treatment). Neither the `share`
    // FormField nor the `memberOwnerIds.0`/`.1` pickers read this path,
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

                {/* The compound field needs room for both numbers, the slash
                    and the mode pill; below ~280px they start to crowd. */}
                <div className="w-[288px] shrink-0">
                    <FormField
                        control={control}
                        name={`ownerships.${index}.share`}
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormLabel>
                                    {t("units.ownershipEditor.shareLabel")}
                                </FormLabel>
                                {/* No defaultDenominator: this is the owner's
                                    share of one unit (the shares must sum to
                                    1), not a share of the house, so the
                                    house's denominator would be wrong here. */}
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
                        <OwnerPicker
                            index={index}
                            slot={0}
                            label={t("units.ownershipEditor.spouseOne")}
                            options={personOptions}
                            // Only people may hold a unit in SJM, so a legal
                            // entity created here would never appear in this
                            // field's options.
                            lockedKind="PERSON"
                            onCreate={startCreatingOwner}
                        />
                        <OwnerPicker
                            index={index}
                            slot={1}
                            label={t("units.ownershipEditor.spouseTwo")}
                            options={personOptions}
                            lockedKind="PERSON"
                            onCreate={startCreatingOwner}
                        />
                    </>
                ) : (
                    <OwnerPicker
                        index={index}
                        slot={0}
                        label={t("units.ownershipEditor.ownerLabel")}
                        options={ownerOptions}
                        onCreate={startCreatingOwner}
                    />
                )}
            </div>

            {membersError && (
                <p className="text-destructive text-detail font-medium">
                    {membersError}
                </p>
            )}

            <CreateOwnerDialog
                open={!!pendingOwner}
                onOpenChange={(open) => !open && setPendingOwner(null)}
                defaultName={pendingOwner?.name}
                lockedKind={pendingOwner?.lockedKind}
                onCreated={(ownerId) => {
                    const slot = pendingSlot.current;
                    if (slot === null) return;
                    setValue(
                        `ownerships.${index}.memberOwnerIds.${slot}`,
                        ownerId,
                        { shouldValidate: true },
                    );
                    pendingSlot.current = null;
                    setPendingOwner(null);
                }}
            />
        </div>
    );
}

interface OwnerPickerProps {
    index: number;
    slot: 0 | 1;
    label: string;
    options: { label: string; value: string }[];
    lockedKind?: CreateOwnerDtoKind;
    onCreate: (pending: PendingOwner) => void;
}

/**
 * One owner slot. Searchable because associations run to hundreds of owners,
 * and able to add one because a name missing from the list used to leave the
 * form with nowhere to go.
 */
function OwnerPicker({
    index,
    slot,
    label,
    options,
    lockedKind,
    onCreate,
}: OwnerPickerProps) {
    const { t } = useTranslation(["admin"]);

    return (
        <FormCombobox
            name={`ownerships.${index}.memberOwnerIds.${slot}`}
            label={label}
            placeholder={t("units.ownershipEditor.ownerPlaceholder")}
            searchPlaceholder={t(
                "units.ownershipEditor.ownerSearchPlaceholder",
            )}
            emptyMessage={t("units.ownershipEditor.ownerNotFound")}
            options={options}
            createLabel={(name) =>
                name
                    ? t("units.ownershipEditor.createOwnerOption", { name })
                    : t("units.ownershipEditor.createOwnerBlank")
            }
            onCreate={(name) => onCreate({ slot, name, lockedKind })}
        />
    );
}
