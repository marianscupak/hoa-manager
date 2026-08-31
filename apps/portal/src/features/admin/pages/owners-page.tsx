import { useMemo, useState } from "react";
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

    const columns = useMemo(
        () =>
            getOwnerColumns(
                t,
                refetch,
                (owner) => setDeletingOwner(owner),
                (owner) => setAddingEmailOwner(owner),
            ),
        [t, refetch],
    );

    return (
        <div className="space-y-6">
            <DataTable
                columns={columns}
                data={owners ?? []}
                gridTemplate="1.9fr 1.1fr 118px 210px"
                isLoading={isLoading}
                loadingMessage={tCommon("loading")}
                emptyMessage={t("owners.empty")}
                emptySearchMessage={t("owners.table.noMatch")}
                searchPlaceholder={t("owners.table.searchPlaceholder")}
                initialSorting={[{ id: "name", desc: false }]}
                countLabel={(info) =>
                    info.paginated
                        ? t("owners.table.range", {
                              from: info.from,
                              to: info.to,
                              total: info.total,
                          })
                        : t("owners.table.count", { count: info.total })
                }
                paginationLabels={{
                    previous: tCommon("pagination.previous"),
                    next: tCommon("pagination.next"),
                }}
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
