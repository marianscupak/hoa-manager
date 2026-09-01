import * as React from "react";

import { cn } from "../lib/utils";

/** Dashed empty-state box with centered muted text and an optional action. */
export function EmptyState({
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
            className={cn(
                "text-muted-foreground rounded-panel border-2 border-dashed px-6 py-12 text-center text-sm",
                className,
            )}
        >
            <p>{message}</p>
            {action && (
                <div className="mt-4 flex justify-center">{action}</div>
            )}
        </div>
    );
}
