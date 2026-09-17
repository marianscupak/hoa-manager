import { useSetAtom } from "jotai";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, Link } from "react-router";

import { toast, Button } from "@hoa-mngr/ui";

import { useAuthControllerExchangeGoogleCode } from "@/api/generated/auth/auth";
import { TenantResponseDtoRole } from "@/api/generated/model";
import {
    accessTokenAtom,
    authStatusAtom,
    tenantContextAtom,
    userAtom,
} from "@/auth/atoms";
import { parseJwt } from "@/auth/jwt";
import { STORAGE_KEYS } from "@/storage/keys";
import { StorageService } from "@/storage/storage";

/** Codes the API redirects here with; anything else falls back to the generic line. */
const CALLBACK_ERROR_KEYS = {
    ACCOUNT_EXISTS: "googleCallback.errors.ACCOUNT_EXISTS",
    EMAIL_NOT_VERIFIED: "googleCallback.errors.EMAIL_NOT_VERIFIED",
} as const;

export function GoogleCallbackPage() {
    const { t } = useTranslation("auth");
    const location = useLocation();
    const navigate = useNavigate();

    const setAccessToken = useSetAtom(accessTokenAtom);
    const setAuthStatus = useSetAtom(authStatusAtom);
    const setTenantContext = useSetAtom(tenantContextAtom);
    const setUser = useSetAtom(userAtom);

    const [mutationError, setMutationError] = useState<string | null>(null);
    const exchangeMutation = useAuthControllerExchangeGoogleCode({
        mutation: {
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

                const redirectUrl = StorageService.getString(
                    STORAGE_KEYS.POST_LOGIN_REDIRECT,
                );
                StorageService.remove(STORAGE_KEYS.POST_LOGIN_REDIRECT);

                if (payload.tid && payload.mid) {
                    setTenantContext({
                        tenantId: payload.tid,
                        membershipId: payload.mid,
                        roles: (payload.roles ?? []) as TenantResponseDtoRole[],
                    });
                    setAuthStatus("authenticated");
                    StorageService.setString(
                        STORAGE_KEYS.LAST_TENANT_ID,
                        payload.tid,
                    );
                    navigate(redirectUrl ?? "/", { replace: true });
                } else {
                    setAuthStatus("select-tenant");
                    navigate(redirectUrl ?? "/tenant", { replace: true });
                }
            },
            onError: () => {
                toast.error(t("googleCallback.error"));
                setMutationError(t("googleCallback.error"));
            },
        },
    });

    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    // The API redirects failures here rather than rendering JSON on its own
    // origin, where Google left the browser standing.
    const errorCode = params.get("error");
    const errorKey =
        errorCode && errorCode in CALLBACK_ERROR_KEYS
            ? CALLBACK_ERROR_KEYS[errorCode as keyof typeof CALLBACK_ERROR_KEYS]
            : "googleCallback.error";
    const error = errorCode
        ? t(errorKey)
        : !code
          ? t("googleCallback.error")
          : mutationError;

    const hasFetched = useRef(false);

    useEffect(() => {
        if (!code || errorCode || hasFetched.current) {
            return;
        }
        hasFetched.current = true;

        exchangeMutation.mutate({ data: { code } });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex w-full items-center justify-center p-8">
            <div className="bg-card w-full max-w-sm rounded-xl border p-8 px-6 text-center shadow-sm sm:px-10">
                <h1 className="text-foreground mb-4 text-2xl font-bold tracking-tight">
                    {t("googleCallback.title")}
                </h1>

                {error ? (
                    <div className="text-destructive">
                        <p className="mb-4">{error}</p>
                        <Button
                            variant="secondary"
                            className="font-semibold"
                            asChild
                        >
                            <Link to="/login">
                                {t("googleCallback.returnToLogin")}
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="flex animate-pulse flex-col items-center">
                        <div className="border-muted border-t-primary h-8 w-8 animate-spin rounded-full border-4" />
                        <p className="text-muted-foreground mt-4 text-sm">
                            {t("googleCallback.loading")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
