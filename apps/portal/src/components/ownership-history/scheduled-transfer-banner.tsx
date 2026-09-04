import { CalendarClockIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@hoa-mngr/ui";

import { formatPeriodDate } from "./rows";

interface ScheduledTransferBannerProps {
    /** ISO instant of the scheduled period's start. */
    effectiveFrom: string;
    /** Omitted on the owner-facing page, where the notice is read-only. */
    onCancel?: () => void;
}

export function ScheduledTransferBanner({
    effectiveFrom,
    onCancel,
}: ScheduledTransferBannerProps) {
    const { t } = useTranslation(["admin"]);

    return (
        <div
            role="status"
            className="bg-primary-tint text-primary-tint-foreground flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
        >
            <span className="inline-flex items-center gap-2 font-medium">
                <CalendarClockIcon className="h-4 w-4 shrink-0" />
                {t("units.details.ownership.scheduledBanner", {
                    date: formatPeriodDate(effectiveFrom),
                })}
            </span>
            {onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                    {t("units.details.ownership.cancelScheduled")}
                </Button>
            )}
        </div>
    );
}
