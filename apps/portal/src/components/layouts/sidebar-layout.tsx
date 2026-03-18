import { LucideIcon, Menu } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

import { Button } from "@hoa-mngr/ui";

export interface NavigationItem {
    name: string;
    href: string;
    icon?: LucideIcon;
    end?: boolean;
}

export interface SidebarLayoutProps {
    navigation: NavigationItem[];
    children: React.ReactNode;
}

export function SidebarLayout({ navigation, children }: SidebarLayoutProps) {
    const { t } = useTranslation(["common"]);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const navContent = (
        <nav className="flex flex-col space-y-1">
            {navigation.map((item) => (
                <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.end}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                        `group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`
                    }
                >
                    {item.icon && (
                        <item.icon className="mr-3 h-5 w-5 shrink-0" />
                    )}
                    {item.name}
                </NavLink>
            ))}
        </nav>
    );

    return (
        <div className="flex flex-1 flex-col lg:flex-row">
            <div className="flex items-center gap-2 border-b bg-white p-4 lg:hidden">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                >
                    <Menu className="mr-2 h-4 w-4" />
                    {t("common:menu")}
                </Button>
            </div>

            {isMobileSidebarOpen && (
                <div className="w-full border-b bg-white p-4 lg:hidden">
                    {navContent}
                </div>
            )}
            <aside className="hidden w-64 shrink-0 border-r bg-white px-6 py-8 lg:block">
                {navContent}
            </aside>

            <main className="mx-auto w-full flex-1 p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
