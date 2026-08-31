import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@hoa-mngr/ui";

import { useMemberControllerGetMembers } from "@/api/generated/tenant-members/tenant-members";

import { getUserColumns } from "../components/users-table/users-table-columns";

export function UsersPage() {
    const { t, i18n } = useTranslation(["admin"]);
    const { t: tCommon } = useTranslation("common");

    const {
        data: members,
        isLoading,
        refetch,
    } = useMemberControllerGetMembers();

    const adminsCount = members?.filter((m) => m.role === "ADMIN").length ?? 0;

    const columns = useMemo(
        () => getUserColumns(t, refetch, adminsCount, i18n.language),
        [t, refetch, adminsCount, i18n.language],
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-foreground text-2xl font-bold tracking-tight">
                    {t("users.title")}
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    {t("users.description")}
                </p>
            </div>

            <DataTable
                columns={columns}
                data={members ?? []}
                gridTemplate="1.4fr 1.6fr 0.9fr 0.9fr 150px"
                isLoading={isLoading}
                loadingMessage={tCommon("loading")}
                emptyMessage={t("users.empty")}
                countLabel={(info) =>
                    t("users.table.count", { count: info.total })
                }
            />
        </div>
    );
}
