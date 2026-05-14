import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useVotesControllerGetActivity } from "@/api/generated/votes/votes";
import { ActivityTimeline } from "@/features/audit/components/activity-timeline";

interface VoteActivityTabProps {
    voteId: string;
    enabled: boolean;
}

export function VoteActivityTab({ voteId, enabled }: VoteActivityTabProps) {
    const { t } = useTranslation(["voting"]);
    const activityQuery = useVotesControllerGetActivity(voteId, {
        query: { enabled },
    });

    if (activityQuery.isLoading) {
        return (
            <div className="flex min-h-[200px] items-center justify-center">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (activityQuery.isError || !activityQuery.data) {
        return (
            <div className="text-destructive p-8 text-center">
                {t("voting:results.activity.error")}
            </div>
        );
    }

    const entries = activityQuery.data.entries;

    if (entries.length === 0) {
        return (
            <div className="p-8 text-center text-sm text-slate-500">
                {t("voting:results.activity.empty")}
            </div>
        );
    }

    return (
        <div className="py-4">
            <ActivityTimeline entries={entries} />
        </div>
    );
}
