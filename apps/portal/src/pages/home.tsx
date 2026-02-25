import { useTranslation } from "react-i18next";
import { Button } from "@hoa-mngr/ui";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function HomePage() {
    const { t } = useTranslation("home");

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center gap-4">
            <div className="absolute right-4 top-4">
                <LocaleSwitcher />
            </div>
            <h1 className="text-4xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
            <Button>{t("cta")}</Button>
        </div>
    );
}
