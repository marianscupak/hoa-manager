import { useTranslation } from "react-i18next";

import { Button } from "@hoa-mngr/ui";

import { useAppControllerGetHello } from "@/api/generated/app/app";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function HomePage() {
    const { t } = useTranslation("home");
    const {
        data: helloResponse,
        isLoading,
        isError,
    } = useAppControllerGetHello();

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center gap-4">
            <div className="absolute top-4 right-4">
                <LocaleSwitcher />
            </div>
            <h1 className="text-4xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>

            <div className="mt-8 mb-8 rounded-lg border border-slate-200 bg-slate-100 p-6 shadow-sm">
                <h2 className="mb-2 text-lg font-semibold">API Test</h2>
                {isLoading ? (
                    <p className="text-muted-foreground animate-pulse">
                        Loading API response...
                    </p>
                ) : isError ? (
                    <p className="text-red-500">
                        Failed to load from API. Is the NestJS backend running?
                    </p>
                ) : (
                    <pre className="rounded border border-green-200 bg-white p-2 font-mono text-sm text-green-600">
                        {helloResponse}
                    </pre>
                )}
            </div>

            <Button>{t("cta")}</Button>
        </div>
    );
}
