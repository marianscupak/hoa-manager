import { Link } from "react-router";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
    const { t } = useTranslation("not-found");

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <h1 className="text-6xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
            <Link to="/" className="text-primary underline underline-offset-4">
                {t("goHome")}
            </Link>
        </div>
    );
}
