import { useAtomValue } from "jotai";
import { Building, Shield, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@hoa-mngr/ui";

import { tenantContextAtom } from "@/auth/atoms";

interface MembershipCardProps {
    communityName: string;
}

export function MembershipCard({ communityName }: MembershipCardProps) {
    const { t } = useTranslation(["home", "common"]);
    const tenantCtx = useAtomValue(tenantContextAtom);

    const role = tenantCtx?.roles[0];
    const translatedRole = role
        ? t(`common:roles.${role}`, { defaultValue: role })
        : "—";

    const items = [
        {
            icon: Building,
            label: t("home:membership.community"),
            value: communityName,
        },
        {
            icon: Shield,
            label: t("home:membership.role"),
            value: translatedRole,
        },
        {
            icon: Activity,
            label: t("home:membership.status"),
            value: t("home:membership.active"),
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    {t("home:membership.title")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.label}
                            className="flex items-center gap-3"
                        >
                            <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                <item.icon className="text-muted-foreground h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs">
                                    {item.label}
                                </span>
                                <span className="text-sm font-medium">
                                    {item.value}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
