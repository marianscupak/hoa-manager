import { useAtomValue } from "jotai";
import { Navigate, Outlet } from "react-router";

import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";

export function AdminGuard() {
    const tenantCtx = useAtomValue(tenantContextAtom);

    if (!isAdminOrBoard(tenantCtx?.roles)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
