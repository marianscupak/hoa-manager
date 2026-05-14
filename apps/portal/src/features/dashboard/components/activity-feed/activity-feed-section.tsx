import { useTranslation } from "react-i18next";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@hoa-mngr/ui";

import { useAuditControllerGetActivity } from "@/api/generated/audit/audit";
import { ActivityTimeline } from "@/features/audit/components/activity-timeline";

export function ActivityFeedSection() {
    const { t } = useTranslation(["dashboard", "common"]);
    const query = useAuditControllerGetActivity({ limit: 10 });

    if (query.isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t("activityFeed.sectionTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="bg-muted h-6 animate-pulse rounded"
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (query.isError) {
        return (
            <Card>
                <CardContent className="flex flex-col items-start gap-2 p-4">
                    <p className="text-destructive text-sm">
                        {t("activityFeed.errorMessage")}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => query.refetch()}
                    >
                        {t("common:retry")}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const entries = query.data?.entries ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("activityFeed.sectionTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
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
