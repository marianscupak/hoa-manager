import * as React from "react";

import { cn } from "../lib/utils";

/** Two-line primary cell: bold name + optional muted category line. */
export function CellPrimary({
    title,
    subtitle,
}: {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
}) {
    return (
        <div className="min-w-0">
            <div className="text-foreground truncate text-sm font-semibold">
                {title}
            </div>
            {subtitle != null && (
                <div className="text-faint truncate text-[11.5px]">
                    {subtitle}
                </div>
            )}
        </div>
    );
}

/** Numeric cell: bold value + faint secondary, tabular figures. No bars. */
export function CellNumeric({
    value,
    secondary,
}: {
    value: React.ReactNode;
    secondary?: React.ReactNode;
}) {
    return (
        <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-foreground text-[13.5px] font-semibold">
                {value}
            </span>
            {secondary != null && (
                <span className="text-faint text-[12.5px]">{secondary}</span>
            )}
        </div>
    );
}

const statusChipVariants = {
    success: "bg-success-muted text-success-tint-foreground",
    warning: "bg-warning-muted text-warning-tint-foreground",
    neutral: "bg-muted text-secondary-foreground",
    destructive: "bg-destructive-muted text-destructive-muted-foreground",
} as const;

export type StatusChipVariant = keyof typeof statusChipVariants;

/** Status pill with a 6px dot in currentColor. System font by design —
 *  Nunito (font-display) is reserved for titles outside tables. */
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
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {children}
        </span>
    );
}

/** Amber inline warning, e.g. "No owner assigned". */
export function WarningPill({ children }: { children: React.ReactNode }) {
    return (
        <span className="bg-warning-muted text-warning-tint-foreground inline-flex items-center rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap">
            {children}
        </span>
    );
}
