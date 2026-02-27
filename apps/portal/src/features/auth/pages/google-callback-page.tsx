import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";

import { toast } from "@hoa-mngr/ui";

import { useAuthControllerExchangeGoogleCode } from "@/api/generated/auth/auth";
import {
    accessTokenAtom,
    authStatusAtom,
    tenantContextAtom,
    userAtom,
} from "@/auth/atoms";
import { parseJwt } from "@/auth/jwt";
import { STORAGE_KEYS } from "@/storage/keys";
import { StorageService } from "@/storage/storage";

export function GoogleCallbackPage() {
    const { t } = useTranslation("auth");
    const location = useLocation();
    const navigate = useNavigate();

    const setAccessToken = useSetAtom(accessTokenAtom);
    const setAuthStatus = useSetAtom(authStatusAtom);
    const setTenantContext = useSetAtom(tenantContextAtom);
    const setUser = useSetAtom(userAtom);

    const [mutationError, setMutationError] = useState<string | null>(null);
    const exchangeMutation = useAuthControllerExchangeGoogleCode();

    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const error = !code ? t("googleCallback.error") : mutationError;

    useEffect(() => {
        if (!code) {
            return;
        }

        exchangeMutation.mutate(
            { data: { code } },
            {
                onSuccess: (data) => {
                    const token = data.accessToken;
                    const payload = parseJwt(token);
                    if (!payload) {
                        toast.error(t("googleCallback.error"));
                        setMutationError(t("googleCallback.error"));
                        return;
                    }

                    setAccessToken(token);
                    setUser({ userId: payload.sub, email: payload.email });

                    if (payload.tid && payload.mid) {
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
                        navigate("/", { replace: true });
                    } else {
                        setAuthStatus("select-tenant");
                        navigate("/select-tenant", { replace: true });
                    }
                },
                onError: () => {
                    toast.error(t("googleCallback.error"));
                    setMutationError(t("googleCallback.error"));
                },
            },
        );
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex w-full items-center justify-center p-8">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 px-6 text-center shadow-sm sm:px-10">
                <h1 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">
                    Signing you in...
                </h1>

                {error ? (
                    <div className="text-red-500">
                        <p className="mb-4">{error}</p>
                        <button
                            onClick={() => navigate("/login")}
                            className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                        >
                            Return to login
                        </button>
                    </div>
                ) : (
                    <div className="flex animate-pulse flex-col items-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
                        <p className="mt-4 text-sm text-slate-500">
                            Please wait while we complete the Google
                            authentication...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
