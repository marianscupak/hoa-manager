import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
            <div className="flex w-full items-center gap-4 rounded-lg border bg-white p-4 shadow-sm sm:w-64">
                <div
                    className={`rounded-md p-2 ${scheduledFrom ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}
                >
                    <Calendar className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
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

            <div className="flex w-full items-center gap-4 rounded-lg border bg-white p-4 shadow-sm sm:w-64">
                <div
                    className={`rounded-md p-2 ${scheduledTo ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}
                >
                    <Calendar className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
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
