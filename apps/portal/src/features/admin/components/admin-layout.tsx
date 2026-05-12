import { useAtomValue } from "jotai";
import { Building2, Shield, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet } from "react-router";

import { tenantContextAtom } from "@/auth/atoms";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";

export function AdminLayout() {
    const { t } = useTranslation(["admin"]);
    const tenantCtx = useAtomValue(tenantContextAtom);

    const isAdmin =
        tenantCtx?.roles.includes("ADMIN") ||
        tenantCtx?.roles.includes("BOARD_MEMBER");

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    const navigation = [
        {
            name: t("nav.units"),
            href: "/admin/units",
            icon: Building2,
        },
        {
            name: t("nav.owners"),
            href: "/admin/owners",
            icon: Users,
        },
        {
            name: t("nav.users"),
            href: "/admin/users",
            icon: Shield,
        },
    ];

    return (
        <SidebarLayout navigation={navigation}>
            <Outlet />
        </SidebarLayout>
    );
}
