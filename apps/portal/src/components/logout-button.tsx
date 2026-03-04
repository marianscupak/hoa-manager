import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation(["common"]);
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
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
        >
            <LogOut className="mr-2 h-4 w-4" />
            {t("common:logout")}
        </Button>
    );
}
