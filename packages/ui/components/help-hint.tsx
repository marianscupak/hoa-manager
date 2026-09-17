"use client";

import { HelpCircle } from "lucide-react";
import * as React from "react";

import { Popover, PopoverAnchor, PopoverContent } from "./popover";
import { cn } from "../lib/utils";

export interface HelpHintProps {
    /**
     * Names the hint. Shown next to the icon when `showLabel` is set, and
     * otherwise carried as the button's accessible name.
     */
    label: string;
    /**
     * Render the label beside the question mark. A bare circle is a guess;
     * with the question spelled out, the person who has it can see that the
     * answer is one click away.
     */
    showLabel?: boolean;
    /** The explanation itself; a node, so it can carry lists and emphasis. */
    children: React.ReactNode;
    className?: string;
    /** Width of the panel. Wide enough for a couple of sentences by default. */
    contentClassName?: string;
}

// Long enough to cross the gap between the trigger and the panel without the
// hint blinking shut, short enough that it does not linger over the page.
const CLOSE_DELAY_MS = 120;

/**
 * The circled question mark that explains a field or a section.
 *
 * Opens on hover and on click, because neither alone is enough: hover is
 * invisible on a touch screen, and a click-only hint goes unnoticed by
 * someone who is already pointing at the thing they do not understand. It
 * stays open while the pointer travels to the panel, and closes on Escape or
 * on a click elsewhere.
 */
export function HelpHint({
    label,
    showLabel = false,
    children,
    className,
    contentClassName,
}: HelpHintProps) {
    const [open, setOpen] = React.useState(false);
    const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelClose = React.useCallback(() => {
        if (closeTimer.current === null) return;
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
    }, []);

    const scheduleClose = React.useCallback(() => {
        cancelClose();
        closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
    }, [cancelClose]);

    React.useEffect(() => cancelClose, [cancelClose]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            {/* An anchor, not a trigger: `PopoverTrigger` toggles on click,
                so on a mouse the hint opened on hover and then shut again on
                the very click meant to pin it. Clicking here only ever opens
                — Escape or a click elsewhere closes. */}
            <PopoverAnchor asChild>
                <button
                    type="button"
                    // No `title`: the browser paints its own tooltip from it,
                    // so the label appeared twice at once — in the panel and
                    // in a native bubble over it. The visible text or the
                    // aria-label names the button on its own.
                    aria-label={showLabel ? undefined : label}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    onClick={() => setOpen(true)}
                    onMouseEnter={() => {
                        cancelClose();
                        setOpen(true);
                    }}
                    onMouseLeave={scheduleClose}
                    onFocus={() => setOpen(true)}
                    className={cn(
                        "text-primary hover:text-primary-hover focus-visible:ring-ring inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                        showLabel ? "text-sm font-medium" : "h-5 w-5",
                        className,
                    )}
                >
                    <HelpCircle className="h-4 w-4 shrink-0" aria-hidden />
                    {showLabel && <span>{label}</span>}
                </button>
            </PopoverAnchor>
            <PopoverContent
                align="start"
                side="top"
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
                // The pointer has to be able to reach the panel; without this
                // a hover-opened hint cannot be read to the end on a trackpad.
                onOpenAutoFocus={(event) => event.preventDefault()}
                className={cn(
                    "text-foreground w-80 space-y-2 p-4 text-sm",
                    contentClassName,
                )}
            >
                {children}
            </PopoverContent>
        </Popover>
    );
}
HelpHint.displayName = "HelpHint";
