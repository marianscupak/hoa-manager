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
                <main className="relative flex-1 overflow-hidden">
                    <BackgroundOrbs />
                    <div className="relative mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
