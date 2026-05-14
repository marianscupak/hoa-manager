import { formatDistanceToNow } from "date-fns";
import { cs, enUS } from "date-fns/locale";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Card, CardContent } from "@hoa-mngr/ui";

import { tenantContextAtom } from "@/auth/atoms";
import type { Role } from "@/auth/roles";

interface PendingInvitesCardProps {
    pending: number;
    oldestPendingCreatedAt: string | null;
}

const NON_AUDITOR_ADMIN_ROLES: Role[] = ["ADMIN", "BOARD_MEMBER"];

export function PendingInvitesCard({
    pending,
    oldestPendingCreatedAt,
}: PendingInvitesCardProps) {
    const { t, i18n } = useTranslation("dashboard");
    const tenantCtx = useAtomValue(tenantContextAtom);
    const locale = i18n.language === "cs" ? cs : enUS;
    const canAct = (tenantCtx?.roles ?? []).some((r) =>
        NON_AUDITOR_ADMIN_ROLES.includes(r),
    );

    if (pending === 0) {
        return (
            <Card>
                <CardContent className="flex h-full flex-col gap-2 p-4">
                    <p className="text-muted-foreground text-3xl font-semibold">
                        0
                    </p>
                    <p className="text-sm">
                        {t("buildingOverview.pendingInvites.none")}
                    </p>
                </CardContent>
            </Card>
        );
    }

    const label =
        pending === 1
            ? t("buildingOverview.pendingInvites.countOne")
            : t("buildingOverview.pendingInvites.countOther", {
                  count: pending,
              });
    const oldestLabel = oldestPendingCreatedAt
        ? t("buildingOverview.pendingInvites.oldest", {
              when: formatDistanceToNow(new Date(oldestPendingCreatedAt), {
                  locale,
              }),
          })
        : null;

    return (
        <Card>
            <CardContent className="flex h-full flex-col gap-2 p-4">
                <p className="text-3xl font-semibold">{pending}</p>
                <p className="text-sm">{label}</p>
                {oldestLabel && (
                    <p className="text-muted-foreground text-xs">
                        {oldestLabel}
                    </p>
                )}
                {canAct && (
                    <Link
                        to="/admin/owners"
                        className="text-primary mt-2 text-sm underline-offset-4 hover:underline"
                    >
                        {t("buildingOverview.pendingInvites.action")}
                    </Link>
                )}
            </CardContent>
        </Card>
    );
}
