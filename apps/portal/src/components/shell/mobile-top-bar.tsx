import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { Button } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import { AppSidebar } from "./app-sidebar";

export function MobileTopBar({ className }: { className?: string }) {
    const { t } = useTranslation(["common"]);
    const { pathname } = useLocation();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Close the drawer whenever navigation happens.
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [pathname]);

    return (
        <>
            <header
                className={cn(
                    "bg-card sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4",
                    className,
                )}
            >
                <div className="flex items-center gap-2.5">
                    <div className="font-display bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-[10px] text-sm font-black shadow-[0_3px_0_#5b21b6]">
                        H
                    </div>
                    <span className="font-display text-foreground text-base font-extrabold tracking-tight">
                        HOA Manager
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDrawerOpen((open) => !open)}
                    aria-expanded={isDrawerOpen}
                    aria-label={
                        isDrawerOpen
                            ? t("common:shell.closeMenu")
                            : t("common:shell.openMenu")
                    }
                >
                    {isDrawerOpen ? <X /> : <Menu />}
                </Button>
            </header>

            {isDrawerOpen && (
                <div className={cn("fixed inset-0 z-40", className)}>
                    <div
                        className="bg-foreground/20 absolute inset-0"
                        aria-hidden
                        onClick={() => setIsDrawerOpen(false)}
                    />
                    <AppSidebar className="absolute top-0 left-0 h-full shadow-2xl" />
                </div>
            )}
        </>
    );
}
