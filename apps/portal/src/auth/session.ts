import { useSetAtom } from "jotai";
import { useEffect, useRef } from "react";

import { authControllerSwitchTenant } from "@/api/generated/auth/auth";
import { STORAGE_KEYS } from "@/storage/keys";
import { StorageService } from "@/storage/storage";

import { authStatusAtom } from "./atoms";
import { parseJwt } from "./jwt";
import { refreshAccessToken } from "./refresh";
import { useSessionManager } from "./use-session-manager";

export function useAuthBoot() {
    const setAuthStatus = useSetAtom(authStatusAtom);
    const { setSession } = useSessionManager();

    const hasBooted = useRef(false);

    useEffect(() => {
        if (hasBooted.current) return;
        hasBooted.current = true;

        const boot = async () => {
            setAuthStatus("initializing");
            try {
                let token = await refreshAccessToken();
                let payload = parseJwt(token);

                if (!payload) {
                    throw new Error("Invalid token payload");
                }

                if (!payload.tid) {
                    const lastTenantId = StorageService.getString(
                        STORAGE_KEYS.LAST_TENANT_ID,
                    );
                    if (lastTenantId) {
                        try {
                            const res = await authControllerSwitchTenant(
                                { tenantId: lastTenantId },
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                },
                            );
                            token = res.accessToken;
                            payload = parseJwt(token);
                            if (!payload)
                                throw new Error("Invalid scoped payload");
                        } catch {
                            StorageService.remove(STORAGE_KEYS.LAST_TENANT_ID);
                        }
                    }
                }

                if (!payload) throw new Error("Invalid payload state");

                setSession(token);
            } catch {
                setAuthStatus("anonymous");
            }
        };

        boot();
    }, [setAuthStatus, setSession]);
}
