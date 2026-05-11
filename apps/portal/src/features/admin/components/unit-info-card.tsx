import { useTranslation } from "react-i18next";

import type { UnitDetailResponseDto } from "@/api/generated/model";

interface UnitInfoCardProps {
    unit: UnitDetailResponseDto | undefined;
}

export function UnitInfoCard({ unit }: UnitInfoCardProps) {
    const { t } = useTranslation(["admin"]);

    return (
        <div className="bg-card rounded-xl border p-6 shadow-sm">
            <h2 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
                {t("admin:units.details.info")}
            </h2>
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
        </div>
    );
}
