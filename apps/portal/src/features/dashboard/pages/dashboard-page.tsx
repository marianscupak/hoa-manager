import { format } from "date-fns";
import { cs, enUS } from "date-fns/locale";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { useTenancyControllerGetUserTenants } from "@/api/generated/tenants/tenants";
import { tenantContextAtom } from "@/auth/atoms";
import { isAdminView } from "@/auth/role-checks";
import { ActivityFeedSection } from "@/features/dashboard/components/activity-feed/activity-feed-section";
import { BuildingOverviewSection } from "@/features/dashboard/components/building-overview/building-overview-section";
import { ComingUpSection } from "@/features/dashboard/components/coming-up/coming-up-section";
import { FeaturedVoteCard } from "@/features/dashboard/components/featured-vote-card/featured-vote-card";
import { NeedsAttentionSection } from "@/features/dashboard/components/needs-attention/needs-attention-section";
import { OwnedUnitsSection } from "@/features/dashboard/components/owned-units/owned-units-section";

export function DashboardPage() {
    const { t, i18n } = useTranslation("dashboard");
    const tenantCtx = useAtomValue(tenantContextAtom);
    const { data: tenants } = useTenancyControllerGetUserTenants();
    const adminView = isAdminView(tenantCtx?.roles);
    const dateLocale = i18n.language === "cs" ? cs : enUS;
    const tenantName =
        tenants?.find((x) => x.id === tenantCtx?.tenantId)?.name ?? "";

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="font-display text-3xl font-black tracking-tight">
                    {t("pageTitle")}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {tenantName} ·{" "}
                    {format(new Date(), "EEEE d. M. yyyy", {
                        locale: dateLocale,
                    })}
                </p>
            </header>

            <FeaturedVoteCard />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
                <div className="flex flex-col gap-6">
                    {adminView ? (
                        <BuildingOverviewSection />
                    ) : (
                        <OwnedUnitsSection />
                    )}
                    {adminView && <NeedsAttentionSection />}
                </div>
                <div className="flex flex-col gap-6">
                    <ComingUpSection />
                    <ActivityFeedSection />
                </div>
            </div>
        </div>
    );
}
