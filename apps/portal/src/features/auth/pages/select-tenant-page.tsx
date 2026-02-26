import { useTenancyControllerGetUserTenants } from "@/api/generated/tenancy/tenancy";
import { useTenantSwitcher } from "@/auth/use-tenant-switcher";

export function SelectTenantPage() {
    const { switchTenant, isSwitching } = useTenantSwitcher();
    const { data: tenants, isLoading } = useTenancyControllerGetUserTenants();

    const handleSwitch = (tenantId: string) => {
        switchTenant(tenantId, { redirectUrl: "/" });
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center text-slate-500">
                Loading your communities...
            </div>
        );
    }

    return (
        <div className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-slate-900">
                Select a Community
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
                        No communities found.
                    </p>
                )}
            </div>
            {isSwitching && (
                <p className="mt-4 text-center text-sm text-slate-500">
                    Joining...
                </p>
            )}
        </div>
    );
}
