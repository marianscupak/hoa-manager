import { useTranslation } from "react-i18next";

export function InviteLoadingState() {
    const { t } = useTranslation(["invite"]);

    return (
        <div className="text-center">
            <div className="border-muted border-t-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4" />
            <p className="text-muted-foreground text-sm">
                {t("status.loading")}
            </p>
        </div>
    );
}
