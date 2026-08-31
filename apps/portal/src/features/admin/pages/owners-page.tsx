import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@hoa-mngr/ui";

import type { OwnerResponseDto } from "@/api/generated/model";
import { useOwnerControllerGetOwners } from "@/api/generated/property-owners/property-owners";

import { AddOwnerEmailDialog } from "../components/add-owner-email-dialog";
import { CreateOwnerDialog } from "../components/create-owner-dialog";
import { DeleteOwnerDialog } from "../components/delete-owner-dialog";
import { getOwnerColumns } from "../components/owners-table/owners-table-columns";

export interface OwnersPageProps {
    createOpen: boolean;
    onCreateOpenChange: (open: boolean) => void;
}

export function OwnersPage({
    createOpen,
    onCreateOpenChange,
}: OwnersPageProps) {
    const { t } = useTranslation(["admin"]);
    const { t: tCommon } = useTranslation("common");
    const [deletingOwner, setDeletingOwner] = useState<OwnerResponseDto | null>(
        null,
    );
    const [addingEmailOwner, setAddingEmailOwner] =
        useState<OwnerResponseDto | null>(null);

    const { data: owners, isLoading, refetch } = useOwnerControllerGetOwners();

    const columns = getOwnerColumns(
        t,
        refetch,
        (owner) => setDeletingOwner(owner),
        (owner) => setAddingEmailOwner(owner),
    );

    return (
        <div className="space-y-6">
            <DataTable
                columns={columns}
                data={owners ?? []}
                isLoading={isLoading}
                emptyMessage={t("owners.empty")}
                loadingMessage={tCommon("loading")}
            />

            <CreateOwnerDialog
                open={createOpen}
                onOpenChange={onCreateOpenChange}
                onSuccess={refetch}
            />

            <DeleteOwnerDialog
                owner={deletingOwner}
                open={!!deletingOwner}
                onOpenChange={(open) => !open && setDeletingOwner(null)}
                onSuccess={refetch}
            />

            <AddOwnerEmailDialog
                owner={addingEmailOwner}
                open={!!addingEmailOwner}
                onOpenChange={(open) => !open && setAddingEmailOwner(null)}
                onSuccess={refetch}
            />
        </div>
    );
}
