import { useSetAtom } from "jotai";
import { useEffect, useRef } from "react";

import { authControllerSwitchTenant } from "@/api/generated/auth/auth";
import { STORAGE_KEYS } from "@/storage/keys";
import { StorageService } from "@/storage/storage";

import {
    accessTokenAtom,
    authStatusAtom,
    tenantContextAtom,
    userAtom,
} from "./atoms";
import { parseJwt } from "./jwt";
import { refreshAccessToken } from "./refresh";

export function useAuthBoot() {
    const setAuthStatus = useSetAtom(authStatusAtom);
    const setAccessToken = useSetAtom(accessTokenAtom);
    const setTenantContext = useSetAtom(tenantContextAtom);
    const setUser = useSetAtom(userAtom);

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

                setAccessToken(token);
                setUser({ userId: payload.sub, email: payload.email });

                if (payload.tid && payload.mid) {
                    setTenantContext({
                        tenantId: payload.tid,
                        membershipId: payload.mid,
                        roles: payload.roles || [],
                    });
                    setAuthStatus("authenticated");
                } else {
                    setAuthStatus("select-tenant");
                }
            } catch {
                setAuthStatus("anonymous");
            }
        };

        boot();
    }, [setAuthStatus, setAccessToken, setTenantContext, setUser]);
}
