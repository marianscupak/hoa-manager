import { useTranslation } from "react-i18next";

import { useVotesControllerGetActivity } from "@/api/generated/votes/votes";
import { ActivityTimeline } from "@/features/audit/components/activity-timeline";
import { Button, ErrorState, PageLoading } from "@hoa-mngr/ui";

interface VoteActivityTabProps {
    voteId: string;
    enabled: boolean;
}

export function VoteActivityTab({ voteId, enabled }: VoteActivityTabProps) {
    const { t } = useTranslation(["voting", "common"]);
    const activityQuery = useVotesControllerGetActivity(voteId, {
        query: { enabled },
    });

    if (activityQuery.isLoading) {
        return <PageLoading className="min-h-[200px]" />;
    }

    if (activityQuery.isError || !activityQuery.data) {
        return (
            <ErrorState
                message={t("voting:results.activity.error")}
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activityQuery.refetch()}
                    >
                        {t("common:retry")}
                    </Button>
                }
            />
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
