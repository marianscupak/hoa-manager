import { useTranslation } from "react-i18next";

export function InviteLoadingState() {
    const { t } = useTranslation(["invite"]);

    return (
        <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            <p className="text-sm text-slate-500">{t("status.loading")}</p>
        </div>
    );
}
