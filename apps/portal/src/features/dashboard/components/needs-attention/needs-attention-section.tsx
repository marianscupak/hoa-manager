import { useAtomValue } from "jotai";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { usePropertyControllerGetOverview } from "@/api/generated/property/property";
import { tenantContextAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";
import { deriveAttentionItems } from "@/features/dashboard/utils/attention-items";

export function NeedsAttentionSection() {
    const { t } = useTranslation("dashboard");
    const tenantCtx = useAtomValue(tenantContextAtom);
    const overviewQuery = usePropertyControllerGetOverview({
        query: { staleTime: 0, refetchOnMount: "always" },
    });

    // Rows link into /admin/units and /admin/owners, which AdminGuard
    // restricts to ADMIN|BOARD_MEMBER. Hide the section for AUDITOR rather
    // than showing dead-end links that bounce back to "/" — same guard the
    // Building card's "Manage" link uses.
    if (!isAdminOrBoard(tenantCtx?.roles)) return null;

    if (!overviewQuery.data) return null;

    const items = deriveAttentionItems(overviewQuery.data);
    if (items.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-muted-foreground text-detail font-semibold tracking-wide uppercase">
                    {t("attention.sectionTitle")}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
                {items.map((item) => (
                    <Link
                        key={item.key}
                        to={item.to}
                        className={cn(
                            "focus-visible:ring-ring flex items-center gap-3 rounded-full px-4 py-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                            item.tone === "warning"
                                ? "bg-warning-muted hover:bg-warning-tint-border"
                                : "bg-primary-tint hover:bg-primary-tint-border",
                        )}
                    >
                        <span
                            className={cn(
                                "font-display text-2xs flex h-[22px] w-[22px] items-center justify-center rounded-full font-extrabold text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]",
                                item.tone === "warning"
                                    ? "bg-warning"
                                    : "bg-primary",
                            )}
                        >
                            {item.count}
                        </span>
                        <span className="text-sm font-semibold">
                            {t(item.labelKey, {
                                defaultValue: item.labelKey,
                                ...item.labelParams,
                            })}
                        </span>
                        <ChevronRight className="text-faint ml-auto h-4 w-4" />
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}
