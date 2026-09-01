import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    ErrorState,
    formatPercent,
    Skeleton,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { usePropertyControllerGetOverview } from "@/api/generated/property/property";
import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";

/** Drift between the assigned building shares and 100%. Mirrors the
 * threshold used by `deriveAttentionItems` so the number and the
 * "needs attention" row agree on when shares are off. */
function verdictFor(sum: number): { drift: number; isWarning: boolean } {
    const drift = Math.abs(100 - sum);
    return { drift, isWarning: drift > 0.005 };
}

export function BuildingOverviewSection() {
    const { t } = useTranslation(["dashboard", "common"]);
    const tenantCtx = useAtomValue(tenantContextAtom);
    const canManage = isAdminOrBoard(tenantCtx?.roles);
    const overviewQuery = usePropertyControllerGetOverview({
        query: { staleTime: 0, refetchOnMount: "always" },
    });

    if (overviewQuery.isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-28 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (overviewQuery.isError || !overviewQuery.data) {
        return (
            <Card>
                <CardContent className="p-4">
                    <ErrorState
                        message={t("buildingOverview.errorMessage")}
                        action={
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => overviewQuery.refetch()}
                            >
                                {t("common:retry")}
                            </Button>
                        }
                    />
                </CardContent>
            </Card>
        );
    }

    const { units, owners, invites } = overviewQuery.data;
    const { isWarning } = verdictFor(units.buildingShareSum);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-muted-foreground text-detail font-semibold tracking-wide uppercase">
                    {t("buildingOverview.sectionTitle")}
                </CardTitle>
                {canManage && (
                    <Link
                        to="/admin/units"
                        className="text-detail font-medium hover:underline"
                    >
                        {t("buildingOverview.manage")}
                    </Link>
                )}
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-5 gap-y-3.5 pt-0">
                <div className="flex items-baseline gap-2">
                    <span className="font-display text-stat font-black">
                        {units.total}
                    </span>
                    <span className="text-muted-foreground text-xs">
                        {t("buildingOverview.units.total")}
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="font-display text-stat font-black">
                        {owners.active}
                    </span>
                    <span className="text-muted-foreground text-xs">
                        {t("buildingOverview.owners.active")}
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span
                        className={cn(
                            "font-display text-stat font-black",
                            isWarning && "text-warning-tint-foreground",
                        )}
                    >
                        {formatPercent(units.buildingShareSum)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                        {t("buildingOverview.buildingShare.title")}
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="font-display text-stat font-black">
                        {invites.pending}
                    </span>
                    <span className="text-muted-foreground text-xs">
                        {t("buildingOverview.pendingInvites.label")}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
