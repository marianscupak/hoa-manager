import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { toast } from "@hoa-mngr/ui";

import { useAuthControllerSwitchTenant } from "@/api/generated/auth/auth";
import { useSessionManager } from "@/auth/use-session-manager";

export function useTenantSwitcher() {
    const { t } = useTranslation("auth");
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { setSession } = useSessionManager();

    const switchTenantMutation = useAuthControllerSwitchTenant();

    const switchTenant = (
        tenantId: string,
        options?: { redirectUrl?: string },
    ) => {
        switchTenantMutation.mutate(
            { data: { tenantId } },
            {
                onSuccess: (res) => {
                    const { success, hasTenant } = setSession(res.accessToken);

                    if (success && hasTenant) {
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
