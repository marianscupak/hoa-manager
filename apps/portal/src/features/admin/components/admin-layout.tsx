import { useAtomValue } from "jotai";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router";

import { Button } from "@hoa-mngr/ui";

import { tenantContextAtom } from "@/auth/atoms";

const navigation = [
    { name: "Units", href: "/admin/units" },
    { name: "Owners", href: "/admin/owners" },
];

export function AdminLayout() {
    const location = useLocation();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const tenantCtx = useAtomValue(tenantContextAtom);

    // TODO: This should allow BOARD_MEMBER users too
    const isAdmin = tenantCtx?.roles.includes("ADMIN");

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    const navContent = (
        <nav className="flex flex-col space-y-1">
            {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                    >
                        {item.name}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="flex flex-1 flex-col gap-8 lg:flex-row">
            <div className="flex items-center gap-2 lg:hidden">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                >
                    <Menu className="mr-2 h-4 w-4" />
                    Menu
                </Button>
            </div>

            {isMobileSidebarOpen && (
                <div className="w-full lg:hidden">{navContent}</div>
            )}
            <aside className="hidden w-64 shrink-0 lg:block">
                {navContent}
            </aside>

            <main className="flex-1">
                <div className="bg-card rounded-xl border p-6 shadow-sm">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
