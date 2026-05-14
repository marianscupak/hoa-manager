import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { tenantContextAtom } from "@/auth/atoms";
import type { Role } from "@/auth/roles";
import { ActivityFeedSection } from "@/features/dashboard/components/activity-feed/activity-feed-section";
import { BuildingOverviewSection } from "@/features/dashboard/components/building-overview/building-overview-section";
import { FeaturedVoteCard } from "@/features/dashboard/components/featured-vote-card/featured-vote-card";
import { OwnedUnitsSection } from "@/features/dashboard/components/owned-units/owned-units-section";

const ADMIN_VIEW_ROLES: Role[] = ["ADMIN", "BOARD_MEMBER", "AUDITOR"];

function isAdminView(roles: readonly Role[] | undefined): boolean {
    if (!roles) return false;
    return roles.some((r) => ADMIN_VIEW_ROLES.includes(r));
}

export function DashboardPage() {
    const { t } = useTranslation("dashboard");
    const tenantCtx = useAtomValue(tenantContextAtom);
    const adminView = isAdminView(tenantCtx?.roles);

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6 md:gap-6 md:px-6 lg:px-8">
            <header>
                <h1 className="text-2xl font-semibold">{t("pageTitle")}</h1>
            </header>

            <FeaturedVoteCard />

            {adminView ? <BuildingOverviewSection /> : <OwnedUnitsSection />}

            <ActivityFeedSection />
        </div>
    );
}
