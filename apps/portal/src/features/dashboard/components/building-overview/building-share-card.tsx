import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Card, CardContent } from "@hoa-mngr/ui";

import { tenantContextAtom } from "@/auth/atoms";
import type { Role } from "@/auth/roles";

interface BuildingShareCardProps {
    buildingShareSum: number;
}

type Verdict = "ok" | "warning" | "error";

const NON_AUDITOR_ADMIN_ROLES: Role[] = ["ADMIN", "BOARD_MEMBER"];

function verdictFor(sum: number): { kind: Verdict; drift: number } {
    const drift = Math.abs(100 - sum);
    if (drift === 0) return { kind: "ok", drift: 0 };
    if (drift < 0.5) return { kind: "warning", drift };
    return { kind: "error", drift };
}

export function BuildingShareCard({ buildingShareSum }: BuildingShareCardProps) {
    const { t } = useTranslation("dashboard");
    const tenantCtx = useAtomValue(tenantContextAtom);
    const canAct = (tenantCtx?.roles ?? []).some((r) =>
        NON_AUDITOR_ADMIN_ROLES.includes(r),
    );
    const { kind, drift } = verdictFor(buildingShareSum);

    const tone =
        kind === "ok"
            ? "border-emerald-500/40"
            : kind === "warning"
              ? "border-amber-500/60"
              : "border-destructive/60";
    const valueTone =
        kind === "ok"
            ? "text-emerald-700"
            : kind === "warning"
              ? "text-amber-700"
              : "text-destructive";

    return (
        <Card className={`border ${tone}`}>
            <CardContent className="flex h-full flex-col gap-2 p-4">
                <p className={`text-3xl font-semibold ${valueTone}`}>
                    {buildingShareSum.toFixed(2)}%
                </p>
                <p className="text-sm">
                    {t("buildingOverview.buildingShare.title")}
                </p>
                <p className="text-muted-foreground text-xs">
                    {kind === "ok"
                        ? t("buildingOverview.buildingShare.ok")
                        : t("buildingOverview.buildingShare.off", {
                              drift: drift.toFixed(2),
                          })}
                </p>
                {kind !== "ok" && canAct && (
                    <Link
                        to="/admin/units"
                        className="text-primary mt-2 text-sm underline-offset-4 hover:underline"
                    >
                        {t("buildingOverview.buildingShare.action")}
                    </Link>
                )}
            </CardContent>
        </Card>
    );
}
