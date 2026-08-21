import { TFunction } from "i18next";
import { MailIcon } from "lucide-react";

import { Badge, ColumnDef } from "@hoa-mngr/ui";

import type { OwnerResponseDto } from "@/api/generated/model";

import { OwnerRowActions } from "./owner-row-actions";

export const getOwnerColumns = (
    t: TFunction<"admin">,
    onSuccess: () => void,
    onDelete: (owner: OwnerResponseDto) => void,
): ColumnDef<OwnerResponseDto>[] => [
    {
        header: t("owners.table.displayName"),
        accessorKey: "displayName",
        className: "font-semibold",
    },
    {
        header: t("owners.table.email"),
        cell: ({ row }) =>
            row.email ? (
                <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <MailIcon className="h-3.5 w-3.5" />
                    {row.email}
                </span>
            ) : (
                <span className="text-faint text-sm">
                    {t("owners.noEmail")}
                </span>
            ),
    },
    {
        header: t("owners.table.userAccount"),
        cell: ({ row }) => {
            if (row.userId) {
                return (
                    <Badge variant="successTint">
                        {t("owners.table.linked")}
                    </Badge>
                );
            }
            if (row.inviteStatus === "pending") {
                return (
                    <Badge variant="warningTint">
                        {t("owners.invite.statusPending")}
                    </Badge>
                );
            }
            if (row.inviteStatus === "expired") {
                return (
                    <Badge variant="destructiveTint">
                        {t("owners.invite.statusExpired")}
                    </Badge>
                );
            }
            return <Badge variant="neutral">{t("owners.notInvited")}</Badge>;
        },
    },
    {
        header: "",
        className: "text-right",
        cell: ({ row }) => (
            <OwnerRowActions
                row={row}
                onSuccess={onSuccess}
                onDelete={onDelete}
            />
        ),
    },
];
