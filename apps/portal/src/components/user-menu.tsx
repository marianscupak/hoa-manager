import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { Building, Check, Globe, LogOut, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
    Avatar,
    AvatarFallback,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { useAuthControllerLogout } from "@/api/generated/auth/auth";
import { TenantResponseDto } from "@/api/generated/model";
import { useTenancyControllerGetUserTenants } from "@/api/generated/tenancy/tenancy";
import {
    accessTokenAtom,
    authStatusAtom,
    tenantContextAtom,
    userAtom,
} from "@/auth/atoms";
import { useTenantSwitcher } from "@/auth/use-tenant-switcher";
import { locales } from "@/i18n/locales";
import { StorageService } from "@/storage/storage";

function getInitials(name?: string, email?: string): string {
    if (name) {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }
    if (email) return email[0].toUpperCase();
    return "U";
}

export function UserMenu() {
    const { i18n, t } = useTranslation(["common"]);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const user = useAtomValue(userAtom);
    const tenantContext = useAtomValue(tenantContextAtom);
    const setAccessToken = useSetAtom(accessTokenAtom);
    const setAuthStatus = useSetAtom(authStatusAtom);
    const setTenantContext = useSetAtom(tenantContextAtom);
    const setUser = useSetAtom(userAtom);

    const { data: tenants } = useTenancyControllerGetUserTenants();
    const { switchTenant, isSwitching } = useTenantSwitcher();
    const logoutMutation = useAuthControllerLogout();

    const handleLogout = () => {
        logoutMutation.mutate(undefined, {
            onSettled: () => {
                setAccessToken(null);
                setTenantContext(null);
                setUser(null);
                setAuthStatus("anonymous");
                StorageService.clearAuthHints();
                queryClient.clear();
            },
        });
    };

    const handleSwitchTenant = (tenantId: string) => {
        if (tenantId === tenantContext?.tenantId) return;
        switchTenant(tenantId);
    };

    const initials = getInitials(user?.fullName, user?.email);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="focus:ring-ring rounded-full transition-opacity outline-none hover:opacity-80 focus:ring-2 focus:ring-offset-2"
                    aria-label="User menu"
                >
                    <Avatar>
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
                {(user?.fullName || user?.email) && (
                    <>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                {user?.fullName && (
                                    <p className="text-sm leading-none font-medium">
                                        {user.fullName}
                                    </p>
                                )}
                                {user?.email && (
                                    <p className="text-muted-foreground text-xs leading-none">
                                        {user.email}
                                    </p>
                                )}
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                    </>
                )}

                <DropdownMenuItem
                    onClick={() => navigate("/profile")}
                    className="cursor-pointer"
                >
                    <User className="mr-2 h-4 w-4" />
                    {t("common:profile")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {tenants && tenants.length > 1 && (
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
                                onClick={() => handleSwitchTenant(tenant.id)}
                                className={cn(
                                    "cursor-pointer",
                                    isSwitching &&
                                        "pointer-events-none opacity-50",
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
                )}

                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                    <div className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" />
                        {t("common:language")}
                    </div>
                </DropdownMenuLabel>
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale.tag}
                        onClick={() => i18n.changeLanguage(locale.tag)}
                        className="cursor-pointer"
                    >
                        <span>{locale.label}</span>
                        {i18n.language === locale.tag && (
                            <Check className="ml-auto h-4 w-4 shrink-0" />
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="text-destructive focus:text-destructive cursor-pointer"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("common:logout")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
