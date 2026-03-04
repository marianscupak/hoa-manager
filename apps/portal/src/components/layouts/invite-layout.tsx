import { Outlet } from "react-router";

import { LocaleSwitcher } from "@/components/locale-switcher";

/**
 * Layout for invite pages that should be accessible regardless of auth status.
 * Unlike PublicLayout (which redirects authenticated users) or AuthLayout
 * (which redirects anonymous users), this layout renders its children
 * unconditionally.
 */
export function InviteLayout() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50">
            <div className="absolute top-4 right-4">
                <LocaleSwitcher />
            </div>
            <div className="w-full max-w-md">
                <Outlet />
            </div>
        </div>
    );
}
