import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { toast } from "@hoa-mngr/ui";

import { useAuthControllerSwitchTenant } from "@/api/generated/auth/auth";
import {
    accessTokenAtom,
    authStatusAtom,
    tenantContextAtom,
    userAtom,
} from "@/auth/atoms";
import { parseJwt } from "@/auth/jwt";
import { STORAGE_KEYS } from "@/storage/keys";
import { StorageService } from "@/storage/storage";

export function useTenantSwitcher() {
    const { t } = useTranslation("auth");
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const setAccessToken = useSetAtom(accessTokenAtom);
    const setAuthStatus = useSetAtom(authStatusAtom);
    const setTenantContext = useSetAtom(tenantContextAtom);
    const setUser = useSetAtom(userAtom);

    const switchTenantMutation = useAuthControllerSwitchTenant();

    const switchTenant = (
        tenantId: string,
        options?: { redirectUrl?: string },
    ) => {
        switchTenantMutation.mutate(
            { data: { tenantId } },
            {
                onSuccess: (res) => {
                    const token = res.accessToken;
                    const payload = parseJwt(token);

                    if (payload && payload.tid && payload.mid) {
                        setAccessToken(token);
                        setUser({ userId: payload.sub, email: payload.email });
                        setTenantContext({
                            tenantId: payload.tid,
                            membershipId: payload.mid,
                            roles: payload.roles || [],
                        });
                        setAuthStatus("authenticated");
                        StorageService.setString(
                            STORAGE_KEYS.LAST_TENANT_ID,
                            payload.tid,
                        );

                        queryClient.clear();

                        if (options?.redirectUrl) {
                            navigate(options.redirectUrl, { replace: true });
                        }

                        toast.success(t("tenantSwitcher.success"));
                    }
                },
                onError: () => {
                    toast.error(t("tenantSwitcher.error"));
                },
            },
        );
    };

    return {
        switchTenant,
        isSwitching: switchTenantMutation.isPending,
        error: switchTenantMutation.error,
    };
}
