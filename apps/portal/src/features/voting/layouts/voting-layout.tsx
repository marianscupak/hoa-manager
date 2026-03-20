import { useAtomValue } from "jotai";
import { BarChart3, PlusCircle, Vote, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";

import { tenantContextAtom } from "@/auth/atoms";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";

export function VotingLayout() {
    const { t } = useTranslation(["voting"]);
    const tenantCtx = useAtomValue(tenantContextAtom);

    const isAdmin =
        tenantCtx?.roles.includes("ADMIN") ||
        tenantCtx?.roles.includes("BOARD_MEMBER");

    const navigation = [
        ...(isAdmin
            ? [
                  {
                      name: t("voting:navigation.createVote"),
                      href: "/voting/create",
                      icon: PlusCircle,
                  },
              ]
            : []),
        {
            name: t("voting:navigation.activeVotes"),
            href: "/voting",
            icon: Vote,
            end: true,
        },
        {
            name: t("voting:navigation.results"),
            href: "/voting/results",
            icon: BarChart3,
        },
        {
            name: t("voting:navigation.delegations"),
            href: "/voting/delegations",
            icon: Users,
        },
    ];

    return (
        <SidebarLayout navigation={navigation}>
            <Outlet />
        </SidebarLayout>
    );
}
