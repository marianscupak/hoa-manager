import { TFunction } from "i18next";
import { MailIcon } from "lucide-react";

import { Badge, StatusChip, type ColumnDef } from "@hoa-mngr/ui";

import type { OwnerResponseDto } from "@/api/generated/model";

import { OwnerRowActions } from "./owner-row-actions";

const DAY_MS = 24 * 60 * 60 * 1000;

function accountChip(row: OwnerResponseDto, t: TFunction<"admin">) {
    if (row.userId) {
        return (
            <StatusChip variant="success">
                {t("owners.table.linked")}
            </StatusChip>
        );
    }
    if (row.inviteStatus === "pending") {
        const days = row.inviteCreatedAt
            ? Math.floor(
                  (Date.now() - new Date(row.inviteCreatedAt).getTime()) /
                      DAY_MS,
              )
            : null;
        return (
            <StatusChip variant="warning">
                {days != null && days > 0
                    ? t("owners.table.chipPendingAged", { days })
                    : t("owners.table.chipPending")}
            </StatusChip>
        );
    }
    if (row.inviteStatus === "expired") {
        return (
            <StatusChip variant="destructive">
                {t("owners.table.chipExpired")}
            </StatusChip>
        );
    }
    return <StatusChip variant="neutral">{t("owners.notInvited")}</StatusChip>;
}

export const getOwnerColumns = (
    t: TFunction<"admin">,
    onSuccess: () => void,
    onDelete: (owner: OwnerResponseDto) => void,
    onAddEmail: (owner: OwnerResponseDto) => void,
): ColumnDef<OwnerResponseDto>[] => [
    {
        id: "name",
        accessorKey: "displayName",
        header: t("owners.table.displayName"),
        enableSorting: true,
        sortingFn: "localeNumeric",
        enableGlobalFilter: true,
        cell: ({ row }) => (
            <span className="text-foreground inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
                <span className="truncate">{row.original.displayName}</span>
                {row.original.kind !== "PERSON" && (
                    <Badge variant="neutral">
                        {row.original.kind === "LEGAL_ENTITY"
                            ? t("owners.kind.legalEntity")
                            : t("owners.kind.association")}
                    </Badge>
                )}
            </span>
        ),
    },
    {
        id: "email",
        accessorFn: (row) => row.email ?? "",
        header: t("owners.table.email"),
        enableSorting: true,
        sortingFn: "localeNumeric",
        enableGlobalFilter: true,
        cell: ({ row }) =>
            row.original.email ? (
                <span className="text-secondary-foreground flex min-w-0 items-center gap-1.5 text-sm">
                    <MailIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{row.original.email}</span>
                </span>
            ) : (
                <span className="text-faint text-[13.5px]">
                    {t("owners.noEmail")}
                </span>
            ),
    },
    {
        id: "account",
        header: t("owners.table.userAccount"),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => accountChip(row.original, t),
    },
    {
        id: "actions",
        header: "",
        enableSorting: false,
        enableGlobalFilter: false,
        meta: { align: "right" },
        cell: ({ row }) => (
            <OwnerRowActions
                row={row.original}
                onSuccess={onSuccess}
                onDelete={onDelete}
                onAddEmail={onAddEmail}
            />
        ),
    },
];
