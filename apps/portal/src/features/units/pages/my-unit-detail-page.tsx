import { ArrowLeftIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    ErrorState,
    formatPercent,
    PageLoading,
} from "@hoa-mngr/ui";

import { useUnitControllerGetOwnershipHistory } from "@/api/generated/property-units/property-units";
import { getApiErrorCode } from "@/api/error-utils";
import { findScheduledPeriod } from "@/components/ownership-history/rows";
import { ScheduledTransferBanner } from "@/components/ownership-history/scheduled-transfer-banner";
import { UnitOwnershipsTable } from "@/components/ownership-history/unit-ownerships-table";

import { sharePercent } from "../utils/shares";

/**
 * One unit as its owner sees it: the unit's share of the building's
 * common parts, and every ownership period with its co-owners.
 *
 * The whole page comes from the ownership-history endpoint, which is
 * authorized for anyone who has ever held the unit. The owned-units
 * list could not stand in for it: that list only covers ownership that
 * is active now, so a former owner — or the incoming owner of a
 * scheduled transfer — would find nothing there.
 */
export function MyUnitDetailPage() {
    const { id } = useParams();
    const { t } = useTranslation(["common", "errors"]);

    if (!id) {
        throw new Error("No unit id provided");
    }

    const {
        data: unit,
        isLoading,
        isError,
        error,
        refetch,
    } = useUnitControllerGetOwnershipHistory(id);

    const backLink = (
        <Link
            to="/units"
            className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors"
        >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            {t("common:myUnits.detail.back")}
        </Link>
    );

    if (isLoading) {
        return <PageLoading label={t("common:loading")} />;
    }

    if (isError || !unit) {
        // A member who follows a link to a unit they have never owned
        // gets a plain explanation and a way back, not a retry button
        // that would fail the same way. Anything else is treated as
        // transient.
        const code = getApiErrorCode(error);
        const isDenied =
            code === "NOT_A_UNIT_OWNER" || code === "UNIT_NOT_FOUND";

        return (
            <div className="space-y-8">
                {backLink}
                <ErrorState
                    message={
                        isDenied
                            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              (t(`errors:${code}` as any) as string)
                            : t("common:myUnits.detail.loadError")
                    }
                    action={
                        isDenied ? undefined : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void refetch()}
                            >
                                {t("common:retry")}
                            </Button>
                        )
                    }
                />
            </div>
        );
    }

    const scheduled = findScheduledPeriod(unit.periods);

    return (
        <div className="space-y-8">
            {backLink}

            <div>
                <h1 className="font-display text-3xl font-black tracking-tight">
                    {t("common:myUnits.detail.title", {
                        unitNo: unit.unitNo,
                    })}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {t("common:myUnits.detail.subtitle")}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                            {t("common:myUnits.detail.shareCardTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-muted-foreground text-sm">
                                    {t("common:myUnits.table.unitNumber")}
                                </dt>
                                <dd className="text-foreground text-lg font-medium">
                                    {unit.unitNo}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground text-sm">
                                    {t("common:myUnits.table.buildingShare")}
                                </dt>
                                <dd className="text-foreground text-lg font-medium tabular-nums">
                                    {unit.buildingShareNumerator}/
                                    {unit.buildingShareDenominator}
                                    <span className="text-muted-foreground ml-2 text-sm font-normal">
                                        {formatPercent(
                                            sharePercent(
                                                unit.buildingShareNumerator,
                                                unit.buildingShareDenominator,
                                            ),
                                        )}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div>
                    <h2 className="text-foreground text-lg font-semibold">
                        {t("common:myUnits.detail.ownershipTitle")}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {t("common:myUnits.detail.ownershipDescription")}
                    </p>
                </div>

                {scheduled && (
                    <ScheduledTransferBanner
                        effectiveFrom={scheduled.validFrom}
                    />
                )}

                <UnitOwnershipsTable periods={unit.periods} isLoading={false} />
            </div>
        </div>
    );
}
