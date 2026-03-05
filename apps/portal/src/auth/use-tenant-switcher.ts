import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { toast } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import { useAuthControllerSwitchTenant } from "@/api/generated/auth/auth";
import { useSessionManager } from "@/auth/use-session-manager";

export function useTenantSwitcher() {
    const { t } = useTranslation("auth");
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { setSession } = useSessionManager();

    const switchTenantMutation = useAuthControllerSwitchTenant({
        mutation: {
            onSuccess: (res) => {
                const { success, hasTenant } = setSession(res.accessToken);

                if (success && hasTenant) {
                    queryClient.clear();

                    navigate("/", { replace: true });

                    toast.success(t("tenantSwitcher.success"));
                }
            },
            onError: showApiError,
        },
    });

    const switchTenant = (tenantId: string) => {
        switchTenantMutation.mutate({ data: { tenantId } });
    };

    return {
        switchTenant,
        isSwitching: switchTenantMutation.isPending,
        error: switchTenantMutation.error,
    };
}
