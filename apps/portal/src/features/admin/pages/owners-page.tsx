import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, DataTable, ColumnDef } from "@hoa-mngr/ui";

import type { OwnerResponseDto } from "@/api/generated/model";
import { useOwnerControllerGetOwners } from "@/api/generated/property-owners/property-owners";

import { CreateOwnerDialog } from "../components/create-owner-dialog";

export function OwnersPage() {
    const { t } = useTranslation(["admin"]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: owners, isLoading, refetch } = useOwnerControllerGetOwners();

    const columns: ColumnDef<OwnerResponseDto>[] = [
        {
            header: t("owners.table.displayName"),
            accessorKey: "displayName",
            className: "font-medium",
        },
        {
            header: t("owners.table.userAccount"),
            cell: ({ row }) =>
                row.userId ? (
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                        {t("owners.table.linked")}
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-500/10 ring-inset">
                        {t("owners.table.unlinked")}
                    </span>
                ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        {t("owners.title")}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        {t("owners.description")}
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    {t("owners.addOwner")}
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={owners ?? []}
                isLoading={isLoading}
                emptyMessage={t("owners.empty")}
            />

            <CreateOwnerDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={refetch}
            />
        </div>
    );
}
