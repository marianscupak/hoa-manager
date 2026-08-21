import { useAtomValue } from "jotai";
import { Navigate, Outlet, useLocation } from "react-router";

import { useTenancyControllerGetUserTenants } from "@/api/generated/tenants/tenants";
import { authStatusAtom } from "@/auth/atoms";

export function AuthGuard() {
    const authStatus = useAtomValue(authStatusAtom);
    const location = useLocation();
    useTenancyControllerGetUserTenants();

    if (authStatus === "anonymous") {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (authStatus === "select-tenant") {
        return <Navigate to="/tenant" replace />;
    }

    return <Outlet />;
}
