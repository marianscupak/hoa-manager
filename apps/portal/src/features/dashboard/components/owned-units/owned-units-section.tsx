import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    ErrorState,
    Skeleton,
} from "@hoa-mngr/ui";

import { useUnitControllerGetMyOwnedUnits } from "@/api/generated/property-units/property-units";

import { OwnedUnitsTable } from "./owned-units-table";

interface OwnedUnitsSectionProps {
    /**
     * Drop the card entirely when the member owns nothing. Set for the
     * administrator dashboard, where the building overview is the main
     * readout and an empty "your units" card would be noise. An owner
     * with no units still sees the explanation.
     */
    hideWhenEmpty?: boolean;
}

export function OwnedUnitsSection({
    hideWhenEmpty,
}: OwnedUnitsSectionProps = {}) {
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
                            <Skeleton key={i} className="h-6 w-full rounded" />
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
                        message={t("ownedUnits.errorMessage")}
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

    const units = query.data ?? [];

    if (units.length === 0 && hideWhenEmpty) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-muted-foreground text-detail font-semibold tracking-wide uppercase">
                    {t("ownedUnits.sectionTitle")}
                </CardTitle>
                {units.length > 0 && (
                    <Link
                        to="/units"
                        className="text-muted-foreground hover:text-foreground text-detail font-medium transition-colors"
                    >
                        {t("ownedUnits.viewAll")}
                    </Link>
                )}
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
