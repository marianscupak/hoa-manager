import type { ReactNode } from "react";

import { cn } from "@hoa-mngr/ui/lib/utils";

/**
 * A small on/off pill for a view filter — "show unchanged", "show all
 * owners". It is a state, not a command, so it reports `aria-pressed` and
 * fills violet when on.
 */
export function TogglePill({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                "focus-visible:ring-ring inline-flex h-[30px] cursor-pointer items-center rounded-full px-[13px] text-[12.5px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                active
                    ? "bg-primary text-primary-foreground shadow-clay-btn-sm"
                    : "bg-muted text-secondary-foreground hover:bg-border",
            )}
        >
            {children}
        </button>
    );
}
