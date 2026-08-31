import { format } from "date-fns";
import { cs, enUS } from "date-fns/locale";
import { TFunction } from "i18next";
import { MailIcon } from "lucide-react";

import {
    StatusChip,
    type ColumnDef,
    type StatusChipVariant,
} from "@hoa-mngr/ui";

import type { MemberResponseDto } from "@/api/generated/model";
import { getInitials } from "@/components/user-menu";

import { UserRowActions } from "./user-row-actions";

const STATUS_CHIP_VARIANT: Record<string, StatusChipVariant> = {
    ACTIVE: "success",
    INVITED: "warning",
};

export const getUserColumns = (
    t: TFunction<"admin">,
    onSuccess: () => void,
    adminsCount: number,
    language: string,
): ColumnDef<MemberResponseDto>[] => [
    {
        id: "name",
        accessorFn: (row) => row.user.fullName ?? "",
        header: t("users.table.name"),
        enableSorting: true,
        enableGlobalFilter: false,
        cell: ({ row }) => (
            <div className="flex min-w-0 items-center gap-2">
                <div className="bg-primary-tint text-primary-tint-foreground flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                    {getInitials(
                        row.original.user.fullName,
                        row.original.user.email,
                    )}
                </div>
                <span className="truncate text-sm font-semibold">
                    {row.original.user.fullName}
                </span>
            </div>
        ),
    },
    {
        id: "email",
        accessorFn: (row) => row.user.email,
        header: t("users.table.email"),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
            <span className="text-secondary-foreground flex min-w-0 items-center gap-1.5 text-sm">
                <MailIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{row.original.user.email}</span>
            </span>
        ),
    },
    {
        id: "status",
        header: t("users.table.statusLabel"),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
            <StatusChip
                variant={STATUS_CHIP_VARIANT[row.original.status] ?? "neutral"}
            >
                {t(`users.table.status.${row.original.status}`)}
            </StatusChip>
        ),
    },
    {
        id: "joined",
        accessorFn: (row) => new Date(row.createdAt).getTime(),
        header: t("users.table.joinedAt"),
        enableSorting: true,
        enableGlobalFilter: false,
        cell: ({ row }) => (
            <span className="text-muted-foreground text-sm">
                {format(new Date(row.original.createdAt), "d. M. yyyy", {
                    locale: language === "cs" ? cs : enUS,
                })}
            </span>
        ),
    },
    {
        id: "role",
        header: t("users.table.role"),
        enableSorting: false,
        enableGlobalFilter: false,
        meta: { align: "right" },
        cell: ({ row }) => (
            <UserRowActions
                member={row.original}
                onSuccess={onSuccess}
                isLastAdmin={adminsCount === 1}
            />
        ),
    },
];
