import { Outlet } from "react-router";

import { BackgroundOrbs } from "@hoa-mngr/ui";

import { AppSidebar } from "./app-sidebar";
import { MobileTopBar } from "./mobile-top-bar";

/**
 * A page that pins an action bar portals it into `<main>` so the bar spans
 * the whole column and can travel the whole page. Inside the content box it
 * could do neither: that box is capped at `max-w-6xl`, and a `sticky`
 * element can never leave its own containing block, so the bar would stop
 * short of the window on both sides and lift off the bottom of the viewport
 * as soon as the content ran out. See `PageActionBar`.
 */
export const PAGE_ACTION_BAR_SLOT_ID = "page-action-bar-slot";

export function AppShell() {
    return (
        <div className="bg-background flex min-h-screen">
            <AppSidebar className="hidden lg:flex" />
            <div className="flex min-w-0 flex-1 flex-col">
                <MobileTopBar className="lg:hidden" />
                {/* `overflow-x-clip`, not `overflow-hidden`: hidden would
                    make this element a scroll container, and a portalled
                    action bar would then have nothing to stick to.
                    `BackgroundOrbs` clips itself, so only the horizontal
                    clip is needed here. */}
                <main
                    id={PAGE_ACTION_BAR_SLOT_ID}
                    className="relative flex flex-1 flex-col overflow-x-clip"
                >
                    <BackgroundOrbs />
                    <div className="relative mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
