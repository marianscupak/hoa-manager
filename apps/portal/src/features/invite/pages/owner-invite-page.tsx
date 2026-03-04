import { AxiosError } from "axios";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router";

import { toast } from "@hoa-mngr/ui";

import {
    useInviteControllerAcceptInvite,
    useInviteControllerGetInviteStatus,
    useInviteControllerRegisterFromInvite,
} from "@/api/generated/owner-invitations/owner-invitations";
import { accessTokenAtom } from "@/auth/atoms";
import { useSessionManager } from "@/auth/use-session-manager";
import { useTenantSwitcher } from "@/auth/use-tenant-switcher";

import { InviteAcceptSection } from "../components/invite-accept-section";
import { InviteActionPicker } from "../components/invite-action-picker";
import { InviteInvalidState } from "../components/invite-invalid-state";
import { InviteLoadingState } from "../components/invite-loading-state";
import { InviteRegisterSection } from "../components/invite-register-section";

function getErrorCode(err: unknown): string | undefined {
    if (err instanceof AxiosError) {
        return (err.response?.data as { code?: string })?.code;
    }
    return undefined;
}

export function OwnerInvitePage() {
    const { t } = useTranslation(["invite"]);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token") ?? "";

    const [showRegisterForm, setShowRegisterForm] = useState(false);

    const currentAccessToken = useAtomValue(accessTokenAtom);
    const isAuthenticated = !!currentAccessToken;

    const { data: statusData, isLoading } = useInviteControllerGetInviteStatus(
        { token },
        { query: { enabled: !!token } },
    );

    const status = isLoading ? "loading" : statusData?.status ?? "not_found";
    const emailMasked = statusData?.emailMasked ?? "";
    const expiresAt = statusData?.expiresAt;

    const { switchTenant } = useTenantSwitcher();

    const acceptMutation = useInviteControllerAcceptInvite({
        mutation: {
            onSuccess: (data) => {
                toast.success(t("accept.success"));
                switchTenant(data.tenantId, { redirectUrl: "/" });
            },
            onError: (err) => {
                const code = getErrorCode(err);
                if (code === "EMAIL_MISMATCH") {
                    toast.error(t("accept.emailMismatch"));
                } else if (code === "EMAIL_NOT_VERIFIED") {
                    toast.error(t("accept.notVerified"));
                } else {
                    toast.error(t("accept.error"));
                }
            },
        },
    });

    const { setSession } = useSessionManager();

    const registerMutation = useInviteControllerRegisterFromInvite({
        mutation: {
            onSuccess: async (data) => {
                const { success } = setSession(data.accessToken);
                if (!success) return;
                toast.success(t("register.success"));
                navigate("/");
            },
            onError: (err) => {
                const code = getErrorCode(err);
                if (code === "ACCOUNT_EXISTS") {
                    toast.error(t("register.accountExists"));
                } else {
                    toast.error(t("register.error"));
                }
            },
        },
    });

    if (status === "loading") {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <InviteLoadingState />
            </div>
        );
    }

    if (status !== "valid") {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <InviteInvalidState
                    status={status as "expired" | "accepted" | "not_found"}
                    emailMasked={emailMasked}
                />
            </div>
        );
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6 text-center">
                    <div className="mb-4 text-4xl">📨</div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        {t("status.valid")}
                    </h1>
                    {emailMasked && (
                        <p className="mt-2 text-sm text-slate-500">
                            {t("status.emailHint", { email: emailMasked })}
                        </p>
                    )}
                    {expiresAt && (
                        <p className="mt-1 text-xs text-slate-400">
                            {t("status.expiresAt", {
                                date: new Date(expiresAt).toLocaleString(),
                            })}
                        </p>
                    )}
                </div>

                {isAuthenticated ? (
                    <InviteAcceptSection
                        onAccept={() =>
                            acceptMutation.mutate({ data: { token } })
                        }
                        isPending={acceptMutation.isPending}
                    />
                ) : showRegisterForm ? (
                    <InviteRegisterSection
                        onRegister={(password) =>
                            registerMutation.mutate({
                                data: { token, password },
                            })
                        }
                        onCancel={() => setShowRegisterForm(false)}
                        isPending={registerMutation.isPending}
                    />
                ) : (
                    <InviteActionPicker
                        token={token}
                        onCreateAccount={() => setShowRegisterForm(true)}
                    />
                )}
            </div>
        </div>
    );
}
