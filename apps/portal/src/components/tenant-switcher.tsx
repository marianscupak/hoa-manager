import { useAtomValue } from "jotai";
import { Check, ChevronsUpDown, Building } from "lucide-react";
import { useTranslation } from "react-i18next";

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
import { useTenancyControllerGetUserTenants } from "@/api/generated/tenants/tenants";
import { tenantContextAtom } from "@/auth/atoms";
import { useTenantSwitcher } from "@/auth/use-tenant-switcher";

export function TenantSwitcher() {
    const { t } = useTranslation("auth");
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
            <div className="bg-card text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-sm opacity-50 shadow-sm">
                <Building className="h-4 w-4" />
                <span>{t("tenantSwitcher.loading")}</span>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="bg-card text-foreground hover:bg-accent focus:ring-ring flex items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition-colors outline-none focus:ring-2">
                <div className="flex items-center gap-2">
                    <Building className="text-muted-foreground h-4 w-4" />
                    <span className="max-w-[200px] truncate">
                        {activeTenant?.name || t("tenantSwitcher.select")}
                    </span>
                </div>
                <ChevronsUpDown className="text-muted-foreground h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                    {t("tenantSwitcher.switch")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {tenants.map((tenant: TenantResponseDto) => (
                    <DropdownMenuItem
                        key={tenant.id}
                        onSelect={() => handleSwitch(tenant.id)}
                        className={cn(
                            "flex cursor-pointer items-center justify-between py-2",
                            isSwitching && "pointer-events-none opacity-50",
                        )}
                    >
                        <span className="truncate pr-4">{tenant.name}</span>
                        {tenant.id === tenantContext?.tenantId && (
                            <Check className="text-foreground h-4 w-4 shrink-0" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
