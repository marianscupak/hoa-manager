import { AlertTriangle } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";

/** Destructive-tinted error panel with an optional action slot (usually a
 *  retry button wired to the query's refetch). Sibling of EmptyState. */
export function ErrorState({
    message,
    action,
    className,
}: {
    message: string;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            role="alert"
            className={cn(
                "rounded-panel bg-destructive-muted flex items-center gap-3 px-[18px] py-3",
                className,
            )}
        >
            <AlertTriangle className="text-destructive-muted-foreground h-4 w-4 shrink-0" />
            <p className="text-destructive-muted-foreground flex-1 text-sm leading-[19px]">
                {message}
            </p>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
