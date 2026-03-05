import { TFunction } from "i18next";
import { MailIcon } from "lucide-react";

import { ColumnDef } from "@hoa-mngr/ui";

import type { OwnerResponseDto } from "@/api/generated/model";

import { OwnerRowActions } from "./owner-row-actions";

export const getOwnerColumns = (
    t: TFunction<"admin">,
    onSuccess: () => void,
): ColumnDef<OwnerResponseDto>[] => [
    {
        header: t("owners.table.displayName"),
        accessorKey: "displayName",
        className: "font-medium",
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
                <span className="text-muted-foreground/50 text-sm">—</span>
            ),
    },
    {
        header: t("owners.table.userAccount"),
        cell: ({ row }) =>
            row.userId ? (
                <span className="bg-success-muted text-success ring-success/20 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                    {t("owners.table.linked")}
                </span>
            ) : (
                <span className="bg-muted text-muted-foreground ring-border inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                    {t("owners.table.unlinked")}
                </span>
            ),
    },
    {
        header: "",
        cell: ({ row }) => <OwnerRowActions row={row} onSuccess={onSuccess} />,
    },
];
