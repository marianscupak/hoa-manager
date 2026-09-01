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

/** Status/label pill — the only tinted pill in the system. `dot` (default
 *  true) marks stateful chips; pass dot={false} for label-ish chips such as
 *  counts and tags. `draft` never shows a dot.
 *  System font by design — Nunito (font-display) is reserved for titles. */
export function StatusChip({
    variant,
    dot = true,
    title,
    className,
    children,
}: {
    variant: StatusChipVariant;
    dot?: boolean;
    title?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <span
            title={title}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap",
                statusChipVariants[variant],
                className,
            )}
        >
            {dot && variant !== "draft" && (
                <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-current"
                />
            )}
            {children}
        </span>
    );
}
