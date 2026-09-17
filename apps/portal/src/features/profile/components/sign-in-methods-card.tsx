import { useQueryClient } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    StatusChip,
    toast,
} from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import {
    getAuthControllerListIdentitiesQueryKey,
    useAuthControllerListIdentities,
    useAuthControllerStartGoogleLink,
    useAuthControllerUnlinkIdentity,
} from "@/api/generated/auth/auth";

/**
 * The ways the account can be signed into, and the buttons that add or remove
 * one.
 *
 * Linking is a round trip to Google rather than a call from here: the account
 * it attaches to comes from the session that started the trip, so the browser
 * has to go and come back.
 */
export function SignInMethodsCard() {
    const { t } = useTranslation(["common"]);
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    // Google sends the browser back here; say what happened and drop the
    // marker so a refresh does not repeat it.
    useEffect(() => {
        if (searchParams.get("linked") !== "google") return;
        toast.success(t("signIn.linkSuccess"));
        searchParams.delete("linked");
        setSearchParams(searchParams, { replace: true });
    }, [searchParams, setSearchParams, t]);

    const { data: identities, isLoading } = useAuthControllerListIdentities();

    // The browser cannot carry the bearer token through a redirect, so the
    // app asks for the URL and navigates itself.
    const startLink = useAuthControllerStartGoogleLink({
        mutation: {
            onSuccess: ({ redirectUrl }) => {
                window.location.href = redirectUrl;
            },
            onError: showApiError,
        },
    });

    const unlink = useAuthControllerUnlinkIdentity({
        mutation: {
            onSuccess: () => {
                toast.success(t("signIn.unlinked"));
                queryClient.invalidateQueries({
                    queryKey: getAuthControllerListIdentitiesQueryKey(),
                });
            },
            onError: showApiError,
        },
    });

    const hasGoogle = !!identities?.some((i) => i.provider === "OIDC_GOOGLE");
    const hasPassword = !!identities?.some((i) => i.provider === "LOCAL");
    // Removing the only way in would lock the account out of itself; the API
    // refuses it too, but a disabled button explains it before the click.
    const canUnlinkGoogle = hasGoogle && hasPassword;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{t("signIn.title")}</CardTitle>
            </CardHeader>
            <CardContent>
                <dl className="divide-y">
                    <div className="flex items-center gap-4 py-4 first:pt-0">
                        <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                            <KeyRound className="text-muted-foreground h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <dt className="text-foreground font-medium">
                                {t("signIn.password")}
                            </dt>
                            <dd className="text-muted-foreground text-sm">
                                {hasPassword
                                    ? t("signIn.passwordSet")
                                    : t("signIn.passwordNotSet")}
                            </dd>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 py-4 last:pb-0">
                        <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                            <span
                                className="text-muted-foreground text-sm font-bold"
                                aria-hidden
                            >
                                G
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <dt className="text-foreground font-medium">
                                {t("signIn.google")}
                            </dt>
                            <dd className="text-muted-foreground text-sm">
                                {hasGoogle
                                    ? t("signIn.googleLinked")
                                    : t("signIn.googleHint")}
                            </dd>
                        </div>
                        {!isLoading &&
                            (hasGoogle ? (
                                <div className="flex items-center gap-2">
                                    <StatusChip variant="success">
                                        {t("signIn.linked")}
                                    </StatusChip>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            !canUnlinkGoogle || unlink.isPending
                                        }
                                        title={
                                            canUnlinkGoogle
                                                ? undefined
                                                : t("signIn.lastMethod")
                                        }
                                        onClick={() =>
                                            unlink.mutate({
                                                provider: "OIDC_GOOGLE",
                                            })
                                        }
                                    >
                                        {t("signIn.unlink")}
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={startLink.isPending}
                                    onClick={() => startLink.mutate()}
                                >
                                    {t("signIn.link")}
                                </Button>
                            ))}
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
}
