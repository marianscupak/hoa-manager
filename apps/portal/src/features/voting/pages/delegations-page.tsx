import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hoa-mngr/ui";

import { tenantContextAtom } from "@/auth/atoms";

import { AdminRecordDelegation } from "../components/delegations/admin-record-delegation";
import { DelegationHelpModal } from "../components/delegations/delegation-help-modal";
import { UserDelegationList } from "../components/delegations/user-delegation-list";

export function DelegationsPage() {
    const { t } = useTranslation(["voting"]);
    const tenantCtx = useAtomValue(tenantContextAtom);

    const isAdmin =
        tenantCtx?.roles.includes("ADMIN") ||
        tenantCtx?.roles.includes("BOARD_MEMBER");

    return (
        <div className="mx-auto max-w-6xl space-y-8 p-6">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t("voting:delegations.title")}
                    </h1>
                    <p className="text-slate-500">
                        {t("voting:delegations.description")}
                    </p>
                </div>
                <DelegationHelpModal />
            </div>

            {isAdmin ? (
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
            ) : (
                <UserDelegationList />
            )}
        </div>
    );
}
