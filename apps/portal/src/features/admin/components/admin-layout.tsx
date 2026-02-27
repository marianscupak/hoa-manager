import { useAtomValue } from "jotai";
import { Link, Navigate, Outlet, useLocation } from "react-router";

import { tenantContextAtom } from "@/auth/atoms";

const navigation = [
    { name: "Units", href: "/admin/units" },
    { name: "Owners", href: "/admin/owners" },
];

export function AdminLayout() {
    const location = useLocation();

    const tenantCtx = useAtomValue(tenantContextAtom);

    // TODO: This should allow BOARD_MEMBER users too
    const isAdmin = tenantCtx?.roles.includes("ADMIN");

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-1 flex-col gap-8 lg:flex-row">
            <aside className="w-full shrink-0 lg:w-64">
                <nav className="flex flex-col space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname.startsWith(
                            item.href,
                        );
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-slate-100 text-slate-900"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className="flex-1">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
