import { format } from "date-fns";
import { TFunction } from "i18next";
import { MailIcon, UserIcon } from "lucide-react";

import { ColumnDef } from "@hoa-mngr/ui";

import type { MemberResponseDto } from "@/api/generated/model";

import { UserRowActions } from "./user-row-actions";

export const getUserColumns = (
    t: TFunction<"admin">,
    onSuccess: () => void,
    adminsCount: number,
): ColumnDef<MemberResponseDto>[] => [
    {
        header: t("users.table.name"),
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                    <UserIcon className="text-muted-foreground h-4 w-4" />
                </div>
                <span className="font-medium">{row.user.fullName}</span>
            </div>
        ),
    },
    {
        header: t("users.table.email"),
        cell: ({ row }) => (
            <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <MailIcon className="h-3.5 w-3.5" />
                {row.user.email}
            </span>
        ),
    },
    {
        header: t("users.table.statusLabel"),
        cell: ({ row }) => (
            <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    row.status === "ACTIVE"
                        ? "bg-success-muted text-success ring-success/20"
                        : row.status === "INVITED"
                          ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                          : "bg-muted text-muted-foreground ring-border"
                }`}
            >
                {t(`users.table.status.${row.status}`)}
            </span>
        ),
    },
    {
        header: t("users.table.joinedAt"),
        cell: ({ row }) => (
            <span className="text-muted-foreground text-sm">
                {format(new Date(row.createdAt), "d. M. yyyy")}
            </span>
        ),
    },
    {
        header: "",
        cell: ({ row }) => (
            <UserRowActions
                member={row}
                onSuccess={onSuccess}
                isLastAdmin={adminsCount === 1}
            />
        ),
    },
];
