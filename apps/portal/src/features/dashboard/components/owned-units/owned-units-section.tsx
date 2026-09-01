import { useTranslation } from "react-i18next";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@hoa-mngr/ui";

import { useUnitControllerGetMyOwnedUnits } from "@/api/generated/property-units/property-units";

import { OwnedUnitsTable } from "./owned-units-table";

export function OwnedUnitsSection() {
    const { t } = useTranslation(["dashboard", "common"]);
    const query = useUnitControllerGetMyOwnedUnits({
        query: { staleTime: 0, refetchOnMount: "always" },
    });

    if (query.isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-muted-foreground text-detail font-semibold tracking-wide uppercase">
                        {t("ownedUnits.sectionTitle")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="space-y-2">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="bg-muted h-6 w-full animate-pulse rounded"
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
                        {t("ownedUnits.errorMessage")}
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

    const units = query.data ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-muted-foreground text-detail font-semibold tracking-wide uppercase">
                    {t("ownedUnits.sectionTitle")}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {units.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        {t("ownedUnits.emptyTitle")}
                    </p>
                ) : (
                    <OwnedUnitsTable units={units} />
                )}
            </CardContent>
        </Card>
    );
}
