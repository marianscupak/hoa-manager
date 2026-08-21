import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@hoa-mngr/ui/lib/utils";

interface VoteDetailTimelineProps {
    scheduledFrom: string | null;
    scheduledTo: string | null;
}

export function VoteDetailTimeline({
    scheduledFrom,
    scheduledTo,
}: VoteDetailTimelineProps) {
    const { t } = useTranslation(["voting"]);

    return (
        <div className="flex flex-col gap-4 sm:flex-row">
            <div className="rounded-panel border-hairline bg-card flex w-full items-center gap-4 border p-4 sm:w-64">
                <div
                    className={cn(
                        "rounded-tile p-2",
                        scheduledFrom
                            ? "bg-primary-tint text-primary"
                            : "bg-muted text-faint",
                    )}
                >
                    <Calendar className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                        {t("voting:detail.timeline.startDate")}
                    </p>
                    {scheduledFrom ? (
                        <p className="mt-0.5 text-sm font-medium">
                            {format(
                                new Date(scheduledFrom),
                                "d. M. yyyy HH:mm",
                            )}
                        </p>
                    ) : (
                        <p className="text-muted-foreground mt-0.5 text-sm italic">
                            {t("voting:detail.timeline.notSet")}
                        </p>
                    )}
                </div>
            </div>

            <div className="rounded-panel border-hairline bg-card flex w-full items-center gap-4 border p-4 sm:w-64">
                <div
                    className={cn(
                        "rounded-tile p-2",
                        scheduledTo
                            ? "bg-warning-muted text-warning-tint-foreground"
                            : "bg-muted text-faint",
                    )}
                >
                    <Calendar className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                        {t("voting:detail.timeline.endDate")}
                    </p>
                    {scheduledTo ? (
                        <p className="mt-0.5 text-sm font-medium">
                            {format(new Date(scheduledTo), "d. M. yyyy HH:mm")}
                        </p>
                    ) : (
                        <p className="text-muted-foreground mt-0.5 text-sm italic">
                            {t("voting:detail.timeline.notSet")}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
