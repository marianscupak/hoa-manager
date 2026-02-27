import { useSetAtom } from "jotai";
import { useCallback } from "react";

import {
    accessTokenAtom,
    authStatusAtom,
    tenantContextAtom,
    userAtom,
} from "@/auth/atoms";
import { parseJwt } from "@/auth/jwt";
import { STORAGE_KEYS } from "@/storage/keys";
import { StorageService } from "@/storage/storage";

export function useSessionManager() {
    const setAccessToken = useSetAtom(accessTokenAtom);
    const setAuthStatus = useSetAtom(authStatusAtom);
    const setTenantContext = useSetAtom(tenantContextAtom);
    const setUser = useSetAtom(userAtom);

    const setSession = useCallback(
        (token: string, persistTenantId: boolean = true) => {
            const payload = parseJwt(token);
            if (!payload) return { success: false, hasTenant: false };

            setAccessToken(token);
            setUser({ userId: payload.sub, email: payload.email });

            if (payload.tid && payload.mid) {
                setTenantContext({
                    tenantId: payload.tid,
                    membershipId: payload.mid,
                    roles: payload.roles || [],
                });
                setAuthStatus("authenticated");
                if (persistTenantId) {
                    StorageService.setString(
                        STORAGE_KEYS.LAST_TENANT_ID,
                        payload.tid,
                    );
                }
                return { success: true, hasTenant: true };
            } else {
                setAuthStatus("select-tenant");
                return { success: true, hasTenant: false };
            }
        },
        [setAccessToken, setUser, setTenantContext, setAuthStatus],
    );

    return { setSession };
}
