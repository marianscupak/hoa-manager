import { useTranslation } from "react-i18next";

interface StatusBadgeProps {
    status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const { t } = useTranslation(["voting"]);

    if (status === "OPEN") {
        return (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                {t("list.status.OPEN")}
            </div>
        );
    }
    if (status === "SCHEDULED") {
        return (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                {t("list.status.SCHEDULED")}
            </div>
        );
    }
    if (status === "CLOSED") {
        return (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                {t("list.status.CLOSED")}
            </div>
        );
    }
    if (status === "DRAFT") {
        return (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-600" />
                {t("list.status.DRAFT")}
            </div>
        );
    }
    return (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-600" />
            {status}
        </div>
    );
}
