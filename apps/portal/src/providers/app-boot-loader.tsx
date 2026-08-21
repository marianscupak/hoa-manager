import { useAtomValue } from "jotai";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { authStatusAtom } from "@/auth/atoms";
import { useAuthBoot } from "@/auth/session";

export function AppBootLoader({ children }: { children: ReactNode }) {
    useAuthBoot();
    const authStatus = useAtomValue(authStatusAtom);
    const { t } = useTranslation("common");

    if (authStatus === "initializing") {
        return (
            <div className="bg-muted flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground animate-pulse">
                    {t("loadingApp")}
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
