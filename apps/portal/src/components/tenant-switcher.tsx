import { useAtomValue } from "jotai";
import { Check, ChevronsUpDown, Building } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { TenantResponseDto } from "@/api/generated/model";
import { useTenancyControllerGetUserTenants } from "@/api/generated/tenancy/tenancy";
import { tenantContextAtom } from "@/auth/atoms";
import { useTenantSwitcher } from "@/auth/use-tenant-switcher";

export function TenantSwitcher() {
    const tenantContext = useAtomValue(tenantContextAtom);
    const { switchTenant, isSwitching } = useTenantSwitcher();

    const { data: tenants, isLoading } = useTenancyControllerGetUserTenants();

    const activeTenant = tenants?.find(
        (t: TenantResponseDto) => t.id === tenantContext?.tenantId,
    );

    const handleSwitch = (tenantId: string) => {
        if (tenantId === tenantContext?.tenantId) return;
        switchTenant(tenantId);
    };

    if (isLoading || !tenants || tenants.length === 0) {
        return (
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 opacity-50 shadow-sm">
                <Building className="h-4 w-4" />
                <span>Loading tenants...</span>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors outline-none hover:bg-slate-50 focus:ring-2 focus:ring-slate-400">
                <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-slate-500" />
                    <span className="max-w-[200px] truncate">
                        {activeTenant?.name || "Select Tenant"}
                    </span>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-slate-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
                <DropdownMenuLabel className="text-xs font-normal text-slate-500">
                    Switch Community
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {tenants.map((tenant: TenantResponseDto) => (
                    <DropdownMenuItem
                        key={tenant.id}
                        onClick={() => handleSwitch(tenant.id)}
                        className={cn(
                            "flex cursor-pointer items-center justify-between py-2",
                            isSwitching && "pointer-events-none opacity-50",
                        )}
                    >
                        <span className="truncate pr-4">{tenant.name}</span>
                        {tenant.id === tenantContext?.tenantId && (
                            <Check className="h-4 w-4 shrink-0 text-slate-900" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
