import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { Button } from "@hoa-mngr/ui";

import { useTenancyControllerGetUserTenants } from "@/api/generated/tenancy/tenancy";
import { tenantContextAtom } from "@/auth/atoms";

export function DashboardPage() {
    const { t } = useTranslation("home");
    const tenantContext = useAtomValue(tenantContextAtom);

    const { data: tenants } = useTenancyControllerGetUserTenants();

    const activeTenant = tenants?.find((t) => t.id === tenantContext?.tenantId);
    const tenantName = activeTenant?.name || "Loading community...";

    return (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
            <h1 className="text-foreground text-4xl font-bold">{tenantName}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>

            <Button className="mt-8">{t("cta")}</Button>
        </div>
    );
}
