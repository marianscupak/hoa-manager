import * as React from "react";

import { cn } from "../lib/utils";

const statusChipVariants = {
    success: "bg-success-muted text-success-tint-foreground",
    warning: "bg-warning-muted text-warning-tint-foreground",
    neutral: "bg-muted text-secondary-foreground",
    destructive: "bg-destructive-muted text-destructive-muted-foreground",
    primary: "bg-primary-tint text-primary-tint-foreground",
    draft: "border-faint text-muted-foreground border border-dashed bg-transparent",
} as const;

export type StatusChipVariant = keyof typeof statusChipVariants;

/** Status pill with a 6px dot in currentColor (no dot for `draft`).
 *  System font by design — Nunito (font-display) is reserved for titles. */
export function StatusChip({
    variant,
    children,
}: {
    variant: StatusChipVariant;
    children: React.ReactNode;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap",
                statusChipVariants[variant],
            )}
        >
            {variant !== "draft" && (
                <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-current"
                />
            )}
            {children}
        </span>
    );
}
