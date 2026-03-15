import { useAtomValue } from "jotai";
import { Navigate, Outlet } from "react-router";

import { tenantContextAtom } from "@/auth/atoms";
import { Role } from "@/auth/roles";

export function VotingAdminGuard() {
    const tenantCtx = useAtomValue(tenantContextAtom);

    const isAdmin =
        tenantCtx?.roles.includes(Role.ADMIN) ||
        tenantCtx?.roles.includes(Role.BOARD_MEMBER);

    if (!isAdmin) {
        return <Navigate to="/voting" replace />;
    }

    return <Outlet />;
}
