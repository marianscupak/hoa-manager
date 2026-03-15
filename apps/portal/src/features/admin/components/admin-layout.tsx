import { useAtomValue } from "jotai";
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
        { name: t("nav.units"), href: "/admin/units" },
        { name: t("nav.owners"), href: "/admin/owners" },
    ];

    return (
        <SidebarLayout navigation={navigation}>
            <Outlet />
        </SidebarLayout>
    );
}
