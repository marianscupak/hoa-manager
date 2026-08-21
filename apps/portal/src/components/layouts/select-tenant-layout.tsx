import { useAtomValue } from "jotai";
import { Navigate, Outlet, useLocation } from "react-router";

import { authStatusAtom } from "@/auth/atoms";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoutButton } from "@/components/logout-button";

export function SelectTenantLayout() {
    const authStatus = useAtomValue(authStatusAtom);
    const location = useLocation();

    if (authStatus === "anonymous") {
        return <Navigate to="/login" replace />;
    }

    // Authenticated users (already inside a tenant) shouldn't see the tenant
    // picker, but they ARE allowed to create another tenant from /tenant/new.
    if (authStatus === "authenticated" && location.pathname !== "/tenant/new") {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="bg-muted relative flex min-h-screen flex-col items-center justify-center">
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <LocaleSwitcher />
                <LogoutButton />
            </div>
            <div className="w-full max-w-md">
                <Outlet />
            </div>
        </div>
    );
}
