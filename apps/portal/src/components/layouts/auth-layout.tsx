import { useAtomValue } from "jotai";
import { Navigate, Outlet, useLocation } from "react-router";

import { useTenancyControllerGetUserTenants } from "@/api/generated/tenancy/tenancy";
import { authStatusAtom } from "@/auth/atoms";
import { MobileNav } from "@/components/mobile-nav";
import { TopNav } from "@/components/top-nav";
import { UserMenu } from "@/components/user-menu";

export function AuthLayout() {
    const authStatus = useAtomValue(authStatusAtom);
    const location = useLocation();
    useTenancyControllerGetUserTenants();

    if (authStatus === "anonymous") {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (authStatus === "select-tenant") {
        return <Navigate to="/tenant" replace />;
    }

    return (
        <div className="bg-muted flex min-h-screen flex-col">
            <header className="bg-card sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b px-4 shadow-sm sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <MobileNav />
                    <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold">
                        H
                    </div>
                    <span className="text-foreground hidden text-lg font-bold sm:inline-block">
                        HOA Manager
                    </span>
                    <TopNav />
                </div>
                <UserMenu />
            </header>
            <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
                <Outlet />
            </main>
        </div>
    );
}
