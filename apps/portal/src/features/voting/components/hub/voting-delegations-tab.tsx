import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hoa-mngr/ui";

import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";

import { AdminRecordDelegation } from "../delegations/admin-record-delegation";
import { CreateDelegationMenu } from "../delegations/create-delegation-menu";
import { UserDelegationList } from "../delegations/user-delegation-list";

export function VotingDelegationsTab() {
    const { t } = useTranslation(["voting"]);
    const tenantCtx = useAtomValue(tenantContextAtom);
    const isAdmin = isAdminOrBoard(tenantCtx?.roles);

    // Above the branch on purpose: `UserDelegationList` renders nothing but an
    // empty state when the member has no proxies yet, which is exactly the
    // member who needs a way to start one. Admins own units too, so they get
    // the same entry point next to their record-a-paper-proxy tab.
    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <CreateDelegationMenu />
            </div>

            {!isAdmin ? (
                <UserDelegationList />
            ) : (
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
            )}
        </div>
    );
}
