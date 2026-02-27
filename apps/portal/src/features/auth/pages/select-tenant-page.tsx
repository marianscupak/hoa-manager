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
            <div className="p-8 text-center text-slate-500">
                {t("selectTenant.loading")}
            </div>
        );
    }

    return (
        <div className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-slate-900">
                {t("selectTenant.title")}
            </h1>
            <div className="flex flex-col space-y-3">
                {tenants?.map((tenant) => (
                    <button
                        key={tenant.id}
                        onClick={() => handleSwitch(tenant.id)}
                        disabled={isSwitching}
                        className="rounded-md border border-slate-300 p-4 text-left hover:border-slate-400 hover:bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                    >
                        <span className="block font-medium text-slate-900">
                            {tenant.name || tenant.id}
                        </span>
                    </button>
                ))}
                {(!tenants || tenants.length === 0) && (
                    <p className="text-center text-sm text-slate-500">
                        {t("selectTenant.noCommunities")}
                    </p>
                )}
            </div>
            {isSwitching && (
                <p className="mt-4 text-center text-sm text-slate-500">
                    {t("selectTenant.joining")}
                </p>
            )}

            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                    {t("selectTenant.notFound")}
                </p>
                <Link
                    to="/tenant/new"
                    className="mt-2 inline-block text-sm font-medium text-slate-900 hover:underline"
                >
                    {t("selectTenant.createNew")}
                </Link>
            </div>
        </div>
    );
}
