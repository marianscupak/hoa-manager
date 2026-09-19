import { Outlet } from "react-router";

import { BackgroundOrbs } from "@hoa-mngr/ui";

import { AppSidebar } from "./app-sidebar";
import { MobileTopBar } from "./mobile-top-bar";

export function AppShell() {
    return (
        <div className="bg-background flex min-h-screen">
            <AppSidebar className="hidden lg:flex" />
            <div className="flex min-w-0 flex-1 flex-col">
                <MobileTopBar className="lg:hidden" />
                {/* `overflow-x-clip`, not `overflow-hidden`: hidden would
                    make this element a scroll container, and a page's own
                    `sticky bottom-0` action bar would then have nothing to
                    stick to. `BackgroundOrbs` clips itself, so only the
                    horizontal clip is needed here. */}
                <main className="relative flex-1 overflow-x-clip">
                    <BackgroundOrbs />
                    <div className="relative mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
