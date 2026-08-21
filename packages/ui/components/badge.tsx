import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/utils";

const badgeVariants = cva(
    "font-display focus:ring-ring inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground border-transparent",
                secondary:
                    "bg-secondary text-secondary-foreground border-transparent",
                destructive:
                    "bg-destructive text-destructive-foreground border-transparent",
                success:
                    "bg-success text-success-foreground border-transparent",
                warning:
                    "bg-warning text-warning-foreground border-transparent",
                outline: "text-foreground",
                primaryTint:
                    "bg-primary-tint text-primary-tint-foreground border-primary-tint-border",
                warningTint:
                    "bg-warning-muted text-warning-tint-foreground border-warning-tint-border",
                successTint:
                    "bg-success-muted text-success-tint-foreground border-success-tint-border",
                destructiveTint:
                    "bg-destructive-muted text-destructive-muted-foreground border-transparent",
                neutral: "bg-muted text-secondary-foreground border-transparent",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
