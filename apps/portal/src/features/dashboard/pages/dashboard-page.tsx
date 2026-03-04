import { useAtomValue } from "jotai";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@hoa-mngr/ui";

import { useTenancyControllerGetUserTenants } from "@/api/generated/tenancy/tenancy";
import { tenantContextAtom } from "@/auth/atoms";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { MembershipCard } from "@/features/dashboard/components/membership-card";
import { QuickLinks } from "@/features/dashboard/components/quick-links";
import { QuickStats } from "@/features/dashboard/components/quick-stats";

const ADMIN_ROLES = ["ADMIN", "BOARD_MEMBER"];

function OwnerPlaceholder() {
    const { t } = useTranslation("home");

    return (
        <Card>
            <CardContent className="flex items-start gap-4 p-6">
                <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <Info className="text-primary h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                        {t("ownerPlaceholder.title")}
                    </span>
                    <span className="text-muted-foreground text-sm">
                        {t("ownerPlaceholder.description")}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

export function DashboardPage() {
    const tenantCtx = useAtomValue(tenantContextAtom);
    const { data: tenants } = useTenancyControllerGetUserTenants();

    const activeTenant = tenants?.find((t) => t.id === tenantCtx?.tenantId);
    const communityName = activeTenant?.name ?? "...";

    const isAdmin = tenantCtx?.roles.some((r) => ADMIN_ROLES.includes(r));

    return (
        <div className="flex flex-col gap-6">
            <DashboardHeader communityName={communityName} />

            {isAdmin ? (
                <>
                    <QuickStats />
                    <div className="grid gap-6 lg:grid-cols-2">
                        <MembershipCard communityName={communityName} />
                        <QuickLinks />
                    </div>
                </>
            ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                    <MembershipCard communityName={communityName} />
                    <OwnerPlaceholder />
                </div>
            )}
        </div>
    );
}
