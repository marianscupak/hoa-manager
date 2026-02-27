import { useAtomValue } from "jotai";
import { Navigate, Outlet } from "react-router";

import { authStatusAtom } from "@/auth/atoms";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoutButton } from "@/components/logout-button";

export function SelectTenantLayout() {
    const authStatus = useAtomValue(authStatusAtom);

    if (authStatus === "anonymous") {
        return <Navigate to="/login" replace />;
    }

    if (authStatus === "authenticated") {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50">
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
