import { useAtomValue } from "jotai";
import { Navigate, Outlet } from "react-router";

import { tenantContextAtom } from "@/auth/atoms";

export function VotingAdminGuard() {
    const tenantCtx = useAtomValue(tenantContextAtom);

    const isAdmin =
        tenantCtx?.roles.includes("ADMIN") ||
        tenantCtx?.roles.includes("BOARD_MEMBER");

    if (!isAdmin) {
        return <Navigate to="/voting" replace />;
    }

    return <Outlet />;
}
