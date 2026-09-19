import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Card, StatusChip } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type { KatastrImportPreviewResponseDto } from "@/api/generated/model";

import { ownersNeedingALook } from "./import-rows";
import { TogglePill } from "./toggle-pill";

type PreviewOwner = KatastrImportPreviewResponseDto["owners"][number];

const OWNER_ACTION_LABEL_KEY = {
    CREATE: "owners.create",
    MATCHED_BY_KATASTR_ID: "owners.byKatastrId",
    MATCHED_BY_ICO: "owners.byIco",
    MATCHED_BY_NAME: "owners.byName",
} as const satisfies Record<PreviewOwner["action"], string>;

/** Amber on a name match, because that is the one match the system cannot
 *  vouch for and the admin has to confirm by eye. */
const OWNER_ACTION_VARIANT = {
    CREATE: "success",
    MATCHED_BY_KATASTR_ID: "neutral",
    MATCHED_BY_ICO: "neutral",
    MATCHED_BY_NAME: "warning",
} as const satisfies Record<
    PreviewOwner["action"],
    "success" | "neutral" | "warning"
>;

function OwnerRow({ owner, zebra }: { owner: PreviewOwner; zebra: boolean }) {
    const { t } = useTranslation("katastr");
    const isCreate = owner.action === "CREATE";

    return (
        <li
            className={cn(
                "border-hairline hover:bg-muted flex flex-wrap items-center gap-x-2.5 gap-y-2 border-b px-5 py-2.5 text-sm last:border-b-0",
                zebra && "bg-surface-zebra",
            )}
        >
            {/* The file's own spelling, surname first as the cadastre
                writes it — the admin is comparing it against the register,
                so it must read exactly as the extract has it. */}
            <span className="mr-1 font-semibold">{owner.displayName}</span>
            <StatusChip
                variant={OWNER_ACTION_VARIANT[owner.action]}
                dot={false}
            >
                {t(OWNER_ACTION_LABEL_KEY[owner.action])}
            </StatusChip>
            {!isCreate && owner.existingDisplayName && (
                <span className="text-muted-foreground text-detail">
                    → {owner.existingDisplayName}
                </span>
            )}
            <span className="text-muted-foreground text-detail whitespace-nowrap">
                {owner.existingEmail ??
                    (isCreate
                        ? t("owners.noEmailInFile")
                        : t("owners.noEmail"))}
            </span>
            {owner.existingHasAccount && (
                <StatusChip variant="primary" dot={false}>
                    {t("owners.hasAccount")}
                </StatusChip>
            )}
        </li>
    );
}

/**
 * Who the extract's owners will become in the register. It opens on the
 * subset that needs a decision — new owners and name matches — because an
 * exact cadastre-ID match needs no review and a full list of thirty buries
 * the four that do.
 */
export function OwnerList({
    owners,
}: {
    owners: KatastrImportPreviewResponseDto["owners"];
}) {
    const { t } = useTranslation("katastr");
    const [showAll, setShowAll] = useState(false);

    const needALook = ownersNeedingALook(owners);
    // With nothing to verify the subset would be an empty list under a
    // sub-line announcing zero of each — show the extract as it is instead.
    const filtered = needALook.length > 0 && !showAll;
    const listing = filtered ? needALook : owners;

    const created = needALook.filter(
        (owner) => owner.action === "CREATE",
    ).length;
    const matchedByName = needALook.length - created;

    if (owners.length === 0) return null;

    return (
        <Card className="overflow-hidden">
            <div className="border-hairline flex flex-wrap items-center justify-between gap-3 border-b py-3 pr-4 pl-5">
                <div>
                    <h2 className="text-md font-bold tracking-[-0.1px]">
                        {t("owners.heading")}
                    </h2>
                    <p className="text-muted-foreground mt-[3px] text-[12.5px]">
                        {!filtered
                            ? t("owners.allShown", { count: owners.length })
                            : created > 0 && matchedByName > 0
                              ? t("owners.needALook", {
                                    created,
                                    matchedByName,
                                })
                              : matchedByName > 0
                                ? t("owners.needALookMatched", {
                                      count: matchedByName,
                                  })
                                : t("owners.needALookCreated", {
                                      count: created,
                                  })}
                    </p>
                </div>
                {needALook.length > 0 && needALook.length < owners.length && (
                    <TogglePill
                        active={showAll}
                        onClick={() => setShowAll((shown) => !shown)}
                    >
                        {showAll
                            ? t("owners.showNeedALook")
                            : t("owners.showAll", { count: owners.length })}
                    </TogglePill>
                )}
            </div>

            <ul>
                {listing.map((owner, index) => (
                    <OwnerRow
                        key={`${owner.displayName}-${index}`}
                        owner={owner}
                        zebra={index % 2 === 0}
                    />
                ))}
            </ul>

            <p className="text-muted-foreground border-hairline border-t px-5 py-[11px] text-[12.5px]">
                {t("owners.noEmailsNote")}
            </p>
        </Card>
    );
}
