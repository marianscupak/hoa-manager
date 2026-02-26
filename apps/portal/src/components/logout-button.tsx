import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { LogOut } from "lucide-react";

import { Button } from "@hoa-mngr/ui";

import { useAuthControllerLogout } from "@/api/generated/auth/auth";
import {
    accessTokenAtom,
    authStatusAtom,
    tenantContextAtom,
    userAtom,
} from "@/auth/atoms";
import { StorageService } from "@/storage/storage";

export function LogoutButton() {
    const queryClient = useQueryClient();

    const setAccessToken = useSetAtom(accessTokenAtom);
    const setAuthStatus = useSetAtom(authStatusAtom);
    const setTenantContext = useSetAtom(tenantContextAtom);
    const setUser = useSetAtom(userAtom);

    const logoutMutation = useAuthControllerLogout();

    const handleLogout = () => {
        logoutMutation.mutate(undefined, {
            onSettled: () => {
                setAccessToken(null);
                setTenantContext(null);
                setUser(null);
                setAuthStatus("anonymous");
                StorageService.clearAuthHints();
                queryClient.clear();
            },
        });
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            title="Logout"
            className="text-slate-500 hover:text-slate-900"
        >
            <LogOut className="h-5 w-5" />
        </Button>
    );
}
