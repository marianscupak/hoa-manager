import { useAtomValue } from "jotai";
import { Link, useLocation } from "react-router";

import { tenantContextAtom } from "@/auth/atoms";

export function TopNav() {
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
        <nav className="ml-6 hidden space-x-6 sm:flex">
            {links.map((link) => (
                <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                        link.active
                            ? "border-primary text-foreground"
                            : "text-muted-foreground hover:border-border hover:text-foreground border-transparent"
                    }`}
                >
                    {link.name}
                </Link>
            ))}
        </nav>
    );
}
