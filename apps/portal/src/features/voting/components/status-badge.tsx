import { useTranslation } from "react-i18next";

interface StatusBadgeProps {
    status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const { t } = useTranslation(["voting"]);

    if (status === "OPEN") {
        return (
            <div className="bg-success-muted text-success-tint-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                <span className="bg-success h-1.5 w-1.5 rounded-full" />
                {t("list.status.OPEN")}
            </div>
        );
    }
    if (status === "SCHEDULED") {
        return (
            <div className="bg-primary-tint text-primary-tint-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                {t("list.status.SCHEDULED")}
            </div>
        );
    }
    if (status === "CLOSED") {
        return (
            <div className="bg-muted text-secondary-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                <span className="bg-faint h-1.5 w-1.5 rounded-full" />
                {t("list.status.CLOSED")}
            </div>
        );
    }
    if (status === "DRAFT") {
        return (
            <div className="text-muted-foreground border-faint inline-flex items-center rounded-full border border-dashed px-2.5 py-0.5 text-xs font-semibold">
                {t("list.status.DRAFT")}
            </div>
        );
    }
    return (
        <div className="bg-muted text-secondary-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            <span className="bg-faint h-1.5 w-1.5 rounded-full" />
            {status}
        </div>
    );
}
