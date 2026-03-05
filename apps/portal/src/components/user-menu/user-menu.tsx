import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { LogOut, User } from "lucide-react";
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

import { useAuthControllerLogout } from "@/api/generated/auth/auth";
import { useTenancyControllerGetUserTenants } from "@/api/generated/tenancy/tenancy";
import {
    accessTokenAtom,
    authStatusAtom,
    tenantContextAtom,
    userAtom,
} from "@/auth/atoms";
import { StorageService } from "@/storage/storage";

import { UserMenuLocaleGroup } from "./user-menu-locale-group";
import { UserMenuTenantGroup } from "./user-menu-tenant-group";

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
    const { t } = useTranslation(["common"]);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const user = useAtomValue(userAtom);
    const setAccessToken = useSetAtom(accessTokenAtom);
    const setAuthStatus = useSetAtom(authStatusAtom);
    const setTenantContext = useSetAtom(tenantContextAtom);
    const setUser = useSetAtom(userAtom);

    const { data: tenants } = useTenancyControllerGetUserTenants();
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

    const initials = getInitials(user?.fullName, user?.email);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="focus:ring-ring cursor-pointer rounded-full transition-opacity outline-none hover:opacity-80 focus:ring-2 focus:ring-offset-2"
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

                <UserMenuTenantGroup tenants={tenants} />
                <UserMenuLocaleGroup />

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
