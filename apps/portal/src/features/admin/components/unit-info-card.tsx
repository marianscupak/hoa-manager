import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@hoa-mngr/ui";

import type { UnitDetailResponseDto } from "@/api/generated/model";

interface UnitInfoCardProps {
    unit: UnitDetailResponseDto | undefined;
}

export function UnitInfoCard({ unit }: UnitInfoCardProps) {
    const { t } = useTranslation(["admin"]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                    {t("admin:units.details.info")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-muted-foreground text-sm">
                            {t("admin:units.details.unitNo")}
                        </dt>
                        <dd className="text-foreground text-lg font-medium">
                            {unit?.unitNo}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground text-sm">
                            {t("admin:units.details.buildingShare")}
                        </dt>
                        <dd className="text-foreground text-lg font-medium">
                            {unit?.buildingShareNumerator}/
                            {unit?.buildingShareDenominator}
                        </dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
}
