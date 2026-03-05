import { useAtomValue } from "jotai";
import { Building, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { TenantResponseDto } from "@/api/generated/model";
import { tenantContextAtom } from "@/auth/atoms";
import { useTenantSwitcher } from "@/auth/use-tenant-switcher";

interface UserMenuTenantGroupProps {
    tenants?: TenantResponseDto[] | null;
}

export function UserMenuTenantGroup({ tenants }: UserMenuTenantGroupProps) {
    const { t } = useTranslation(["common"]);
    const tenantContext = useAtomValue(tenantContextAtom);
    const { switchTenant, isSwitching } = useTenantSwitcher();

    if (!tenants || tenants.length <= 1) return null;

    const handleSwitchTenant = (tenantId: string) => {
        if (tenantId === tenantContext?.tenantId) return;
        switchTenant(tenantId);
    };

    return (
        <>
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                <div className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" />
                    {t("common:community")}
                </div>
            </DropdownMenuLabel>
            {tenants.map((tenant: TenantResponseDto) => (
                <DropdownMenuItem
                    key={tenant.id}
                    onSelect={() => handleSwitchTenant(tenant.id)}
                    className={cn(
                        "cursor-pointer",
                        isSwitching && "pointer-events-none opacity-50",
                    )}
                >
                    <span className="truncate">{tenant.name}</span>
                    {tenant.id === tenantContext?.tenantId && (
                        <Check className="ml-auto h-4 w-4 shrink-0" />
                    )}
                </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
        </>
    );
}
