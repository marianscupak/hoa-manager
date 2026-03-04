import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { useTenancyControllerGetUserTenants } from "@/api/generated/tenancy/tenancy";
import { useTenantSwitcher } from "@/auth/use-tenant-switcher";

export function SelectTenantPage() {
    const { t } = useTranslation("auth");
    const { switchTenant, isSwitching } = useTenantSwitcher();
    const { data: tenants, isLoading } = useTenancyControllerGetUserTenants();

    const handleSwitch = (tenantId: string) => {
        switchTenant(tenantId, { redirectUrl: "/" });
    };

    if (isLoading) {
        return (
            <div className="text-muted-foreground p-8 text-center">
                {t("selectTenant.loading")}
            </div>
        );
    }

    return (
        <div className="bg-card w-full rounded-xl border p-8 shadow-sm">
            <h1 className="text-foreground mb-6 text-center text-2xl font-bold tracking-tight">
                {t("selectTenant.title")}
            </h1>
            <div className="flex flex-col space-y-3">
                {tenants?.map((tenant) => (
                    <button
                        key={tenant.id}
                        onClick={() => handleSwitch(tenant.id)}
                        disabled={isSwitching}
                        className="hover:border-primary hover:bg-accent focus:ring-ring rounded-md border p-4 text-left focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                    >
                        <span className="text-foreground block font-medium">
                            {tenant.name || tenant.id}
                        </span>
                    </button>
                ))}
                {(!tenants || tenants.length === 0) && (
                    <p className="text-muted-foreground text-center text-sm">
                        {t("selectTenant.noCommunities")}
                    </p>
                )}
            </div>
            {isSwitching && (
                <p className="text-muted-foreground mt-4 text-center text-sm">
                    {t("selectTenant.joining")}
                </p>
            )}

            <div className="mt-8 border-t pt-6 text-center">
                <p className="text-muted-foreground text-sm">
                    {t("selectTenant.notFound")}
                </p>
                <Link
                    to="/tenant/new"
                    className="text-foreground mt-2 inline-block text-sm font-medium hover:underline"
                >
                    {t("selectTenant.createNew")}
                </Link>
            </div>
        </div>
    );
}
