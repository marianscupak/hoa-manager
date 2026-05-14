import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Card, CardContent } from "@hoa-mngr/ui";

import { tenantContextAtom } from "@/auth/atoms";
import type { Role } from "@/auth/roles";

interface UnitsCardProps {
    total: number;
    withoutOwnersCount: number;
}

const NON_AUDITOR_ADMIN_ROLES: Role[] = ["ADMIN", "BOARD_MEMBER"];

export function UnitsCard({ total, withoutOwnersCount }: UnitsCardProps) {
    const { t } = useTranslation("dashboard");
    const tenantCtx = useAtomValue(tenantContextAtom);
    const canAct = (tenantCtx?.roles ?? []).some((r) =>
        NON_AUDITOR_ADMIN_ROLES.includes(r),
    );

    const subStat =
        withoutOwnersCount === 0
            ? t("buildingOverview.units.allAssigned")
            : withoutOwnersCount === 1
              ? t("buildingOverview.units.withoutOwnersOne")
              : t("buildingOverview.units.withoutOwnersOther", {
                    count: withoutOwnersCount,
                });

    return (
        <Card>
            <CardContent className="flex h-full flex-col gap-2 p-4">
                <p className="text-3xl font-semibold">{total}</p>
                <p className="text-sm">{t("buildingOverview.units.total")}</p>
                <p className="text-muted-foreground text-xs">{subStat}</p>
                {withoutOwnersCount > 0 && canAct && (
                    <Link
                        to="/admin/units"
                        className="text-primary mt-2 text-sm underline-offset-4 hover:underline"
                    >
                        {t("buildingOverview.units.action")}
                    </Link>
                )}
            </CardContent>
        </Card>
    );
}
