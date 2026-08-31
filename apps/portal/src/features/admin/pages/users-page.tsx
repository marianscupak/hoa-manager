import { useTranslation } from "react-i18next";

import { DataTableLegacy } from "@hoa-mngr/ui";

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

    const columns = getUserColumns(t, refetch, adminsCount, i18n.language);

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

            <DataTableLegacy
                columns={columns}
                data={members ?? []}
                isLoading={isLoading}
                emptyMessage={t("users.empty")}
                loadingMessage={tCommon("loading")}
            />
        </div>
    );
}
