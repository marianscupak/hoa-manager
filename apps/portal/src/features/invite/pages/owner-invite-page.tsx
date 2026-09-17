import { useAtomValue } from "jotai";
import { MailOpen } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router";

import { toast } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
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
    const accountExists = statusData?.accountExists ?? false;

    const { switchTenant } = useTenantSwitcher();

    const acceptMutation = useInviteControllerAcceptInvite({
        mutation: {
            onSuccess: (data) => {
                toast.success(t("accept.success"));
                switchTenant(data.tenantId);
            },
            onError: showApiError,
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
            onError: showApiError,
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
            <div className="bg-card w-full max-w-md rounded-xl border p-8 shadow-sm">
                <div className="mb-6 text-center">
                    <div className="mb-4 flex justify-center">
                        <MailOpen className="text-primary h-12 w-12" />
                    </div>
                    <h1 className="text-foreground text-2xl font-bold tracking-tight">
                        {t("status.valid")}
                    </h1>
                    {emailMasked && (
                        <p className="text-muted-foreground mt-2 text-sm">
                            {t("status.emailHint", { email: emailMasked })}
                        </p>
                    )}
                    {expiresAt && (
                        <p className="text-muted-foreground/70 mt-1 text-xs">
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
                        accountExists={accountExists}
                        onCreateAccount={() => setShowRegisterForm(true)}
                    />
                )}
            </div>
        </div>
    );
}
