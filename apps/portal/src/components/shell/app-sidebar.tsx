import { useAtomValue } from "jotai";
import { Building, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation } from "react-router";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type { TenantResponseDto } from "@/api/generated/model";
import { useTenancyControllerGetUserTenants } from "@/api/generated/tenants/tenants";
import { tenantContextAtom, userAtom } from "@/auth/atoms";
import { isAdminOrBoard } from "@/auth/role-checks";
import { Role } from "@/auth/roles";
import { useTenantSwitcher } from "@/auth/use-tenant-switcher";
import { getInitials, UserMenu } from "@/components/user-menu";

import { BrandMark } from "./brand-mark";
import {
    ADMIN_NAV,
    MAIN_NAV,
    PLANNED_NAV,
    type SidebarNavItem,
} from "./sidebar-nav";

/** Role shown under the user's name in the sidebar footer — highest wins. */
const ROLE_PRIORITY = [
    Role.ADMIN,
    Role.BOARD_MEMBER,
    Role.AUDITOR,
    Role.UNIT_OWNER,
] as const;

function SidebarNavLink({ item }: { item: SidebarNavItem }) {
    const { t } = useTranslation(["common"]);
    const { pathname } = useLocation();
    const forcedActive = item.isActive?.(pathname);

    return (
        <NavLink
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
                cn(
                    "focus-visible:ring-ring flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    forcedActive ?? isActive
                        ? "bg-primary-tint text-primary-tint-foreground shadow-clay-inset font-bold"
                        : "text-secondary-foreground hover:bg-muted font-medium",
                )
            }
        >
            <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {t(item.labelKey, { defaultValue: item.labelKey })}
        </NavLink>
    );
}

function TenantSwitcherPill({ tenantName }: { tenantName: string }) {
    const { t } = useTranslation(["common", "auth"]);
    const tenantCtx = useAtomValue(tenantContextAtom);
    const { data: tenants } = useTenancyControllerGetUserTenants();
    const { switchTenant, isSwitching } = useTenantSwitcher();

    const handleSwitchTenant = (tenantId: string) => {
        if (tenantId === tenantCtx?.tenantId) return;
        switchTenant(tenantId);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="rounded-tile border-border bg-card text-foreground hover:bg-muted focus-visible:ring-ring text-detail shadow-clay-card mb-4 flex w-full cursor-pointer items-center justify-between gap-2 border px-3 py-2 font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none">
                <span className="flex min-w-0 items-center gap-2">
                    <Building
                        className="text-muted-foreground h-3.5 w-3.5 shrink-0"
                        strokeWidth={2}
                    />
                    <span className="truncate">
                        {tenantName || t("auth:tenantSwitcher.select")}
                    </span>
                </span>
                <ChevronsUpDown className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-[220px]">
                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                    {t("common:community")}
                </DropdownMenuLabel>
                {tenants?.map((tenant: TenantResponseDto) => (
                    <DropdownMenuItem
                        key={tenant.id}
                        onSelect={() => handleSwitchTenant(tenant.id)}
                        className={cn(
                            "cursor-pointer",
                            isSwitching && "pointer-events-none opacity-50",
                        )}
                    >
                        <span className="truncate">{tenant.name}</span>
                        {tenant.id === tenantCtx?.tenantId && (
                            <Check className="ml-auto h-4 w-4 shrink-0" />
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/tenant/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("auth:selectTenant.createNew")}
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function AppSidebar({ className }: { className?: string }) {
    const { t } = useTranslation(["common"]);
    const tenantCtx = useAtomValue(tenantContextAtom);
    const user = useAtomValue(userAtom);
    const { data: tenants } = useTenancyControllerGetUserTenants();

    const tenantName =
        tenants?.find((x) => x.id === tenantCtx?.tenantId)?.name ?? "";
    const adminOrBoard = isAdminOrBoard(tenantCtx?.roles);
    const highestRole = ROLE_PRIORITY.find((role) =>
        tenantCtx?.roles.includes(role),
    );

    return (
        <aside
            className={cn(
                "bg-card sticky top-0 flex h-screen w-[236px] shrink-0 flex-col border-r px-3 py-4",
                className,
            )}
        >
            <BrandMark className="mb-4 px-1.5" />

            <TenantSwitcherPill tenantName={tenantName} />

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
                {MAIN_NAV.map((item) => (
                    <SidebarNavLink key={item.to} item={item} />
                ))}
                {adminOrBoard && (
                    <>
                        <p className="text-faint text-2xs mt-4 mb-1 px-3.5 font-bold tracking-wider uppercase">
                            {t("common:shell.administrationGroup")}
                        </p>
                        {ADMIN_NAV.map((item) => (
                            <SidebarNavLink key={item.to} item={item} />
                        ))}
                    </>
                )}
                <p className="text-faint text-2xs mt-4 mb-1 px-3.5 font-bold tracking-wider uppercase">
                    {t("common:shell.plannedGroup")}
                </p>
                {PLANNED_NAV.map((item) => (
                    <div
                        key={item.labelKey}
                        className="text-faint flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium"
                        aria-disabled
                    >
                        <item.icon
                            className="h-4 w-4 shrink-0"
                            strokeWidth={2}
                        />
                        {t(item.labelKey, { defaultValue: item.labelKey })}
                        <span className="bg-primary-tint text-primary text-2xs ml-auto rounded-full px-2 py-px font-bold">
                            {t("common:shell.soon")}
                        </span>
                    </div>
                ))}
            </nav>

            <div className="border-hairline mt-2 border-t pt-3">
                <UserMenu
                    trigger={
                        <button
                            type="button"
                            className="hover:bg-muted focus-visible:ring-ring flex w-full cursor-pointer items-center gap-2.5 rounded-full px-2 py-1.5 text-left focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <span className="font-display bg-primary-tint text-primary-tint-foreground shadow-clay-inset flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-extrabold">
                                {getInitials(user?.fullName, user?.email)}
                            </span>
                            <span className="min-w-0">
                                <span className="text-foreground text-detail block truncate font-semibold">
                                    {user?.fullName ?? user?.email}
                                </span>
                                {highestRole && (
                                    <span className="text-muted-foreground text-2xs block">
                                        {t(`common:roles.${highestRole}`)}
                                    </span>
                                )}
                            </span>
                        </button>
                    }
                />
            </div>
        </aside>
    );
}
