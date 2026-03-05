import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { Badge } from "@hoa-mngr/ui";

import { tenantContextAtom, userAtom } from "@/auth/atoms";

interface DashboardHeaderProps {
    associationName: string;
}

export function DashboardHeader({ associationName }: DashboardHeaderProps) {
    const { t } = useTranslation(["home", "common"]);
    const user = useAtomValue(userAtom);
    const tenantCtx = useAtomValue(tenantContextAtom);

    const role = tenantCtx?.roles[0];
    const translatedRole = role
        ? t(`common:roles.${role}`, { defaultValue: role })
        : undefined;

    const greeting = user?.fullName
        ? t("home:greeting", { name: user.fullName })
        : t("home:greetingFallback");

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
                <h1 className="text-foreground text-2xl font-bold">
                    {greeting}
                </h1>
                {translatedRole && (
                    <Badge variant="outline">{translatedRole}</Badge>
                )}
            </div>
            <p className="text-muted-foreground text-sm">{associationName}</p>
        </div>
    );
}
