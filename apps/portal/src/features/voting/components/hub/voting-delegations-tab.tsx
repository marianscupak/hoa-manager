import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hoa-mngr/ui";

import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";

import { AdminRecordDelegation } from "../delegations/admin-record-delegation";
import { UserDelegationList } from "../delegations/user-delegation-list";

export function VotingDelegationsTab() {
    const { t } = useTranslation(["voting"]);
    const tenantCtx = useAtomValue(tenantContextAtom);
    const isAdmin = isAdminOrBoard(tenantCtx?.roles);

    if (!isAdmin) {
        return <UserDelegationList />;
    }

    return (
        <Tabs defaultValue="list" className="space-y-6">
            <TabsList>
                <TabsTrigger value="list" className="px-6">
                    {t("voting:delegations.tabs.myDelegations")}
                </TabsTrigger>
                <TabsTrigger value="admin" className="px-6">
                    {t("voting:delegations.tabs.recordProxy")}
                </TabsTrigger>
            </TabsList>
            <TabsContent value="list" className="focus:outline-none">
                <UserDelegationList />
            </TabsContent>
            <TabsContent value="admin" className="focus:outline-none">
                <AdminRecordDelegation />
            </TabsContent>
        </Tabs>
    );
}
