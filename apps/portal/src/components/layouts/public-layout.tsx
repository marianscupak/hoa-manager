import { useAtomValue } from "jotai";
import { Navigate, Outlet } from "react-router";

import { authStatusAtom } from "@/auth/atoms";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { STORAGE_KEYS } from "@/storage/keys";
import { StorageService } from "@/storage/storage";

export function PublicLayout() {
    const authStatus = useAtomValue(authStatusAtom);

    const storedRedirect = StorageService.getString(
        STORAGE_KEYS.POST_LOGIN_REDIRECT,
    );

    if (authStatus === "authenticated") {
        if (storedRedirect) {
            StorageService.remove(STORAGE_KEYS.POST_LOGIN_REDIRECT);
        }
        return <Navigate to={storedRedirect ?? "/"} replace />;
    }

    if (authStatus === "select-tenant") {
        if (storedRedirect) {
            StorageService.remove(STORAGE_KEYS.POST_LOGIN_REDIRECT);
        }
        return <Navigate to={storedRedirect ?? "/tenant"} replace />;
    }

    return (
        <div className="bg-muted relative flex min-h-screen flex-col items-center justify-center">
            <div className="absolute top-4 right-4">
                <LocaleSwitcher />
            </div>
            <div className="w-full max-w-md">
                <Outlet />
            </div>
        </div>
    );
}
