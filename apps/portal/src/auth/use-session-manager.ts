import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { TenantResponseDtoRole } from "@/api/generated/model";
import {
    accessTokenAtom,
    authStatusAtom,
    tenantContextAtom,
    userAtom,
} from "@/auth/atoms";

import { parseJwt } from "./jwt";
import { STORAGE_KEYS } from "../storage/keys";
import { StorageService } from "../storage/storage";

export function useSessionManager() {
    const { i18n } = useTranslation();
    const setAccessToken = useSetAtom(accessTokenAtom);
    const setAuthStatus = useSetAtom(authStatusAtom);
    const setTenantContext = useSetAtom(tenantContextAtom);
    const setUser = useSetAtom(userAtom);

    const setSession = useCallback(
        (token: string) => {
            const payload = parseJwt(token);
            if (!payload) return { success: false, hasTenant: false };

            setAccessToken(token);
            setUser({
                userId: payload.sub,
                email: payload.email,
                fullName: payload.fullName,
                preferredLanguage: payload.preferredLanguage,
            });

            if (payload.preferredLanguage) {
                i18n.changeLanguage(payload.preferredLanguage);
            }

            if (payload.tid && payload.mid) {
                setTenantContext({
                    tenantId: payload.tid as string,
                    membershipId: payload.mid as string,
                    roles: (payload.roles || []) as TenantResponseDtoRole[],
                });
                setAuthStatus("authenticated");
                StorageService.setString(
                    STORAGE_KEYS.LAST_TENANT_ID,
                    payload.tid,
                );
                return { success: true, hasTenant: true };
            } else {
                setAuthStatus("select-tenant");
                return { success: true, hasTenant: false };
            }
        },
        [setAccessToken, setUser, setTenantContext, setAuthStatus, i18n],
    );

    return { setSession };
}
