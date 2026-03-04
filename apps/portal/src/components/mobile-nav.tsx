import { useAtomValue } from "jotai";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";

import { Button } from "@hoa-mngr/ui";

import { tenantContextAtom } from "@/auth/atoms";

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const tenantCtx = useAtomValue(tenantContextAtom);
    const location = useLocation();

    const isAdmin = tenantCtx?.roles.includes("ADMIN");

    const links = [
        {
            name: "Dashboard",
            path: "/",
            active: location.pathname === "/",
        },
    ];

    if (isAdmin) {
        links.push({
            name: "Admin",
            path: "/admin",
            active: location.pathname.startsWith("/admin"),
        });
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle navigation"
            >
                {isOpen ? (
                    <X className="h-5 w-5" />
                ) : (
                    <Menu className="h-5 w-5" />
                )}
            </Button>

            {isOpen && (
                <div className="bg-card fixed inset-x-0 top-16 z-20 border-b p-4 shadow-lg sm:hidden">
                    <nav className="flex flex-col space-y-1">
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                    link.active
                                        ? "bg-accent text-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </>
    );
}
