import { useTranslation } from "react-i18next";

import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    ErrorState,
    Skeleton,
} from "@hoa-mngr/ui";

import { useAuditControllerGetActivity } from "@/api/generated/audit/audit";
import { ActivityTimeline } from "@/features/audit/components/activity-timeline";

export function ActivityFeedSection() {
    const { t } = useTranslation(["dashboard", "common"]);
    const query = useAuditControllerGetActivity(
        { limit: 10 },
        { query: { staleTime: 0, refetchOnMount: "always" } },
    );

    if (query.isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-muted-foreground text-detail font-semibold tracking-wide uppercase">
                        {t("activityFeed.sectionTitle")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="space-y-2">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-6 rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (query.isError) {
        return (
            <Card>
                <CardContent className="p-4">
                    <ErrorState
                        message={t("activityFeed.errorMessage")}
                        action={
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => query.refetch()}
                            >
                                {t("common:retry")}
                            </Button>
                        }
                    />
                </CardContent>
            </Card>
        );
    }

    const entries = query.data?.entries ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-muted-foreground text-detail font-semibold tracking-wide uppercase">
                    {t("activityFeed.sectionTitle")}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {entries.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        {t("activityFeed.emptyTitle")}
                    </p>
                ) : (
                    <ActivityTimeline entries={entries} />
                )}
            </CardContent>
        </Card>
    );
}
