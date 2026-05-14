import { useTranslation } from "react-i18next";

import { Button, Card, CardContent } from "@hoa-mngr/ui";

import { usePropertyControllerGetOverview } from "@/api/generated/property/property";

import { BuildingShareCard } from "./building-share-card";
import { OwnersCard } from "./owners-card";
import { PendingInvitesCard } from "./pending-invites-card";
import { UnitsCard } from "./units-card";

export function BuildingOverviewSection() {
    const { t } = useTranslation(["dashboard", "common"]);
    const overviewQuery = usePropertyControllerGetOverview();

    if (overviewQuery.isLoading) {
        return (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="bg-muted/30 h-24 animate-pulse p-4" />
                    </Card>
                ))}
            </div>
        );
    }

    if (overviewQuery.isError || !overviewQuery.data) {
        return (
            <Card>
                <CardContent className="flex flex-col items-start gap-2 p-4">
                    <p className="text-destructive text-sm">
                        {t("buildingOverview.errorMessage")}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => overviewQuery.refetch()}
                    >
                        {t("common:retry")}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const { units, owners, invites } = overviewQuery.data;
    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <PendingInvitesCard
                pending={invites.pending}
                oldestPendingCreatedAt={invites.oldestPendingCreatedAt}
            />
            <UnitsCard
                total={units.total}
                withoutOwnersCount={units.withoutOwnersCount}
            />
            <OwnersCard active={owners.active} />
            <BuildingShareCard buildingShareSum={units.buildingShareSum} />
        </div>
    );
}
