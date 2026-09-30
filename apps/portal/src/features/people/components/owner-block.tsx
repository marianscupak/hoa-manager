import { HouseIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Button, CellNumeric, formatPercent, StatusChip } from "@hoa-mngr/ui";

import type { OwnerResponseDto, UnitResponseDto } from "@/api/generated/model";
import { DeleteOwnerDialog } from "@/features/admin/components/delete-owner-dialog";
import { RenameOwnerDialog } from "@/features/admin/components/rename-owner-dialog";
import { shareCellValues } from "@/features/units/utils/shares";
import { unitUsageLabel } from "@/features/units/utils/unit-usage";

import { holdingsState } from "../utils/owner-holdings";
import { toOwnerRef, type PersonRow } from "../utils/people-filter";
import { BlockSection, Field, FieldList, PersonBlock } from "./person-block";

const KIND_LABEL = {
    PERSON: "owners.kind.person",
    LEGAL_ENTITY: "owners.kind.legalEntity",
    ASSOCIATION: "owners.kind.association",
} as const;

interface OwnerBlockProps {
    person: PersonRow;
    /** The unit register; undefined until it first arrives. */
    units: UnitResponseDto[] | undefined;
    unitsStatus: { isLoading: boolean; isError: boolean };
    /** Deleting an owner is ADMIN-only, as the endpoint already enforces. */
    isAdmin: boolean;
    onAddEmail: () => void;
    onChanged: () => void;
}

/** The person as the ownership register knows them. */
export function OwnerBlock({
    person,
    units,
    unitsStatus,
    isAdmin,
    onAddEmail,
    onChanged,
}: OwnerBlockProps) {
    const { t } = useTranslation(["admin"]);
    const { t: tUnits } = useTranslation(["common", "admin"]);
    const navigate = useNavigate();
    const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);

    // Stable across renders: RenameOwnerDialog resets its field whenever
    // `owner` changes, so a fresh object on every render would wipe what the
    // admin is typing the moment anything else on the page re-renders.
    const { ownerId, displayName } = person;
    const ownerRef = useMemo(
        () => toOwnerRef({ ownerId, displayName }) as OwnerResponseDto | null,
        [ownerId, displayName],
    );

    const blockProps = {
        icon: HouseIcon,
        title: t("people.detail.owner.title"),
        caption: t("people.detail.owner.caption"),
    };

    if (!person.ownerId) {
        return (
            <PersonBlock {...blockProps}>
                <div className="rounded-panel border-2 border-dashed px-[18px] py-4">
                    <p className="text-sm font-semibold">
                        {t("people.detail.owner.notOnRegisterTitle")}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {t("people.detail.owner.notOnRegisterBody")}
                    </p>
                </div>
            </PersonBlock>
        );
    }

    const holdings = holdingsState(units, unitsStatus, person.ownerId);

    return (
        <PersonBlock
            {...blockProps}
            action={
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialog("rename")}
                >
                    <PencilIcon />
                    {t("owners.rename.action")}
                </Button>
            }
        >
            <FieldList>
                <Field label={t("people.detail.owner.name")}>
                    <span className="font-semibold">{person.displayName}</span>
                </Field>
                <Field label={t("people.detail.owner.email")}>
                    {person.email ?? (
                        <span className="inline-flex flex-wrap items-baseline gap-2">
                            <span className="text-faint">
                                {t("owners.noEmail")}
                            </span>
                            <button
                                type="button"
                                onClick={onAddEmail}
                                className="text-primary-tint-foreground cursor-pointer font-semibold hover:underline"
                            >
                                {t("owners.addEmail.action")}
                            </button>
                        </span>
                    )}
                </Field>
                {person.kind && (
                    <Field label={t("people.detail.owner.type")}>
                        {t(KIND_LABEL[person.kind])}
                    </Field>
                )}
                {person.kind === "LEGAL_ENTITY" && person.ico && (
                    <Field label={t("people.detail.owner.companyId")}>
                        <span className="tabular-nums">{person.ico}</span>
                    </Field>
                )}
            </FieldList>

            <BlockSection className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                        {t("people.detail.owner.holdings")}
                    </h3>
                    {person.unitCount > 0 && (
                        <span className="text-muted-foreground text-sm tabular-nums">
                            {t("people.table.unitCount", {
                                count: person.unitCount,
                            })}{" "}
                            · {formatPercent(Number(person.sharePercent), 1)}
                        </span>
                    )}
                </div>
                {holdings.kind === "loading" ? (
                    <p className="text-faint text-sm">
                        {tUnits("common:loading")}
                    </p>
                ) : holdings.kind === "error" ? (
                    <p className="text-destructive text-sm">
                        {t("people.detail.owner.holdingsError")}
                    </p>
                ) : holdings.holdings.length === 0 ? (
                    <p className="text-faint text-sm">
                        {t("people.detail.owner.noHoldings")}
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {holdings.holdings.map(({ unit, coOwners }) => {
                            const usage = unitUsageLabel(
                                tUnits,
                                unit.usageCode,
                                unit.usageName,
                            );
                            return (
                                <li
                                    key={unit.id}
                                    className="bg-muted/40 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                                >
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-2 text-sm font-semibold">
                                            {unit.unitNo}
                                            {usage && (
                                                <StatusChip
                                                    variant="neutral"
                                                    dot={false}
                                                >
                                                    {usage}
                                                </StatusChip>
                                            )}
                                        </p>
                                        {coOwners.length > 0 && (
                                            <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                                {t(
                                                    "people.detail.owner.coOwners",
                                                    {
                                                        names: coOwners.join(
                                                            ", ",
                                                        ),
                                                    },
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <div className="shrink-0">
                                        <CellNumeric
                                            {...shareCellValues(
                                                unit.buildingShareNumerator,
                                                unit.buildingShareDenominator,
                                            )}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </BlockSection>

            {isAdmin && (
                <BlockSection className="space-y-2">
                    <Button
                        variant="tableActionDanger"
                        size="sm"
                        disabled={person.hasOwnershipRecords}
                        onClick={() => setDialog("delete")}
                    >
                        <Trash2Icon />
                        {t("owners.delete.title")}
                    </Button>
                    {person.hasOwnershipRecords && (
                        <p className="text-faint text-xs">
                            {t("owners.delete.blockedHint")}
                        </p>
                    )}
                </BlockSection>
            )}

            <RenameOwnerDialog
                owner={dialog === "rename" ? ownerRef : null}
                open={dialog === "rename"}
                onOpenChange={(open) => !open && setDialog(null)}
                onSuccess={onChanged}
            />
            <DeleteOwnerDialog
                owner={dialog === "delete" ? ownerRef : null}
                open={dialog === "delete"}
                onOpenChange={(open) => !open && setDialog(null)}
                onSuccess={() => {
                    onChanged();
                    navigate("/people");
                }}
            />
        </PersonBlock>
    );
}
