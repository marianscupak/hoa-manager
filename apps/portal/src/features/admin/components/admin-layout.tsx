import { useAtomValue } from "jotai";
import { Navigate, Outlet } from "react-router";

import { tenantContextAtom } from "@/auth/atoms";

import { SidebarLayout } from "../../../components/layouts/sidebar-layout";

const navigation = [
    { name: "Units", href: "/admin/units" },
    { name: "Owners", href: "/admin/owners" },
];

export function AdminLayout() {
    const tenantCtx = useAtomValue(tenantContextAtom);

    const isAdmin =
        tenantCtx?.roles.includes("ADMIN") ||
        tenantCtx?.roles.includes("BOARD_MEMBER");

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <SidebarLayout navigation={navigation}>
            <Outlet />
        </SidebarLayout>
    );
}
