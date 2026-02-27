import { useAtomValue } from "jotai";
import { Navigate, Outlet } from "react-router";

import { authStatusAtom } from "@/auth/atoms";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function PublicLayout() {
    const authStatus = useAtomValue(authStatusAtom);

    if (authStatus === "authenticated") {
        return <Navigate to="/" replace />;
    }

    if (authStatus === "select-tenant") {
        return <Navigate to="/select-tenant" replace />;
    }

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
