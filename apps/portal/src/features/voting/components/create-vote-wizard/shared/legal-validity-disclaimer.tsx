import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LegalValidityDisclaimer() {
    const { t } = useTranslation(["voting"]);

    return (
        <div className="animate-in fade-in slide-in-from-top-2 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 duration-300">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-900">
                    {t("voting:create.legalValidityDisclaimer.title")}
                </p>
                <p className="text-xs leading-relaxed text-amber-800">
                    {t("voting:create.legalValidityDisclaimer.description")}
                </p>
            </div>
        </div>
    );
}
