import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, DataTable } from "@hoa-mngr/ui";

import { useOwnerControllerGetOwners } from "@/api/generated/property-owners/property-owners";

import { CreateOwnerDialog } from "../components/create-owner-dialog";
import { getOwnerColumns } from "../components/owners-table/owners-table-columns";

export function OwnersPage() {
    const { t } = useTranslation(["admin"]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: owners, isLoading, refetch } = useOwnerControllerGetOwners();

    const columns = getOwnerColumns(t, refetch);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-foreground text-2xl font-bold tracking-tight">
                        {t("owners.title")}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
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
