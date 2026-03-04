import { useAtomValue } from "jotai";
import { Globe, Mail, Shield, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@hoa-mngr/ui";

import { useTenancyControllerGetUserTenants } from "@/api/generated/tenancy/tenancy";
import { tenantContextAtom, userAtom } from "@/auth/atoms";

const localeNames: Record<string, string> = {
    en: "English",
    cs: "Čeština",
};

export function ProfilePage() {
    const { t, i18n } = useTranslation(["common"]);
    const user = useAtomValue(userAtom);
    const tenantCtx = useAtomValue(tenantContextAtom);
    const { data: tenants } = useTenancyControllerGetUserTenants();

    const activeTenant = tenants?.find((t) => t.id === tenantCtx?.tenantId);

    const translatedRoles = tenantCtx?.roles
        .map((role) => t(`common:roles.${role}`, { defaultValue: role }))
        .join(", ");

    const infoItems = [
        {
            icon: User,
            label: t("common:profile"),
            value: user?.fullName || "—",
        },
        {
            icon: Mail,
            label: "Email",
            value: user?.email || "—",
        },
        {
            icon: Shield,
            label: "Role",
            value: translatedRoles || "—",
        },
        {
            icon: Globe,
            label: t("common:language"),
            value: localeNames[i18n.language] || i18n.language,
        },
    ];

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div>
                <h1 className="text-foreground text-2xl font-bold tracking-tight">
                    {t("common:profile")}
                </h1>
                {activeTenant && (
                    <p className="text-muted-foreground mt-1 text-sm">
                        {activeTenant.name}
                    </p>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {t("common:profile")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="divide-y">
                        {infoItems.map((item) => (
                            <div
                                key={item.label}
                                className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                            >
                                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                                    <item.icon className="text-muted-foreground h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <dt className="text-muted-foreground text-sm">
                                        {item.label}
                                    </dt>
                                    <dd className="text-foreground truncate font-medium">
                                        {item.value}
                                    </dd>
                                </div>
                            </div>
                        ))}
                    </dl>
                </CardContent>
            </Card>
        </div>
    );
}
