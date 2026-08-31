import { format } from "date-fns";
import { cs, enUS } from "date-fns/locale";
import { TFunction } from "i18next";
import { MailIcon } from "lucide-react";

import { Badge, LegacyColumnDef } from "@hoa-mngr/ui";

import type { MemberResponseDto } from "@/api/generated/model";
import { getInitials } from "@/components/user-menu";

import { UserRowActions } from "./user-row-actions";

const STATUS_BADGE_VARIANT = {
    ACTIVE: "successTint",
    INVITED: "warningTint",
} as const;

export const getUserColumns = (
    t: TFunction<"admin">,
    onSuccess: () => void,
    adminsCount: number,
    language: string,
): LegacyColumnDef<MemberResponseDto>[] => [
    {
        header: t("users.table.name"),
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <div className="bg-primary-tint text-primary-tint-foreground font-display flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold">
                    {getInitials(row.user.fullName, row.user.email)}
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
            <Badge
                variant={
                    STATUS_BADGE_VARIANT[
                        row.status as keyof typeof STATUS_BADGE_VARIANT
                    ] ?? "neutral"
                }
            >
                {t(`users.table.status.${row.status}`)}
            </Badge>
        ),
    },
    {
        header: t("users.table.joinedAt"),
        cell: ({ row }) => (
            <span className="text-muted-foreground text-sm">
                {format(new Date(row.createdAt), "d. M. yyyy", {
                    locale: language === "cs" ? cs : enUS,
                })}
            </span>
        ),
    },
    {
        header: "",
        className: "text-right",
        cell: ({ row }) => (
            <UserRowActions
                member={row}
                onSuccess={onSuccess}
                isLastAdmin={adminsCount === 1}
            />
        ),
    },
];
