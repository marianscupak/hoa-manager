import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

interface VoteDetailTimelineProps {
    scheduledFrom: string | null;
    scheduledTo: string | null;
}

export function VoteDetailTimeline({ scheduledFrom, scheduledTo }: VoteDetailTimelineProps) {
    const { t } = useTranslation(["voting"]);

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {scheduledFrom && (
                <div className="flex items-center gap-4 rounded-lg border bg-white p-4 shadow-sm w-full sm:w-64">
                    <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {t("voting:detail.timeline.startDate")}
                        </p>
                        <p className="text-sm font-medium mt-0.5">
                            {format(new Date(scheduledFrom), "d. M. yyyy HH:mm")}
                        </p>
                    </div>
                </div>
            )}
            
            {scheduledTo && (
                <div className="flex items-center gap-4 rounded-lg border bg-white p-4 shadow-sm w-full sm:w-64">
                    <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {t("voting:detail.timeline.endDate")}
                        </p>
                        <p className="text-sm font-medium mt-0.5">
                            {format(new Date(scheduledTo), "d. M. yyyy HH:mm")}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
