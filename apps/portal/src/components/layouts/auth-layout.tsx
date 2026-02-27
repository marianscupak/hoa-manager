import { useAtomValue } from "jotai";
import { Navigate, Outlet, useLocation } from "react-router";

import { useTenancyControllerGetUserTenants } from "@/api/generated/tenancy/tenancy";
import { authStatusAtom } from "@/auth/atoms";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoutButton } from "@/components/logout-button";
import { TenantSwitcher } from "@/components/tenant-switcher";

export function AuthLayout() {
    const authStatus = useAtomValue(authStatusAtom);
    const location = useLocation();
    const { data: tenants } = useTenancyControllerGetUserTenants();

    if (authStatus === "anonymous") {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (authStatus === "select-tenant") {
        return <Navigate to="/tenant" replace />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 font-bold text-white">
                        H
                    </div>
                    <span className="hidden text-lg font-bold text-slate-900 sm:inline-block">
                        HOA Manager
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {(tenants?.length ?? 0) > 1 && <TenantSwitcher />}
                    <LocaleSwitcher />
                    <LogoutButton />
                </div>
            </header>
            <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
                <Outlet />
            </main>
        </div>
    );
}
