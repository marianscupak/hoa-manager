import { Loader2 } from "lucide-react";

import { cn } from "../lib/utils";

/** Centered spinner for full-page loads. Content slots use Skeleton;
 *  tables and buttons keep their own in-place loading conventions. */
export function PageLoading({
    label,
    className,
}: {
    label?: string;
    className?: string;
}) {
    return (
        <div
            role="status"
            className={cn(
                "flex min-h-[400px] flex-col items-center justify-center gap-3",
                className,
            )}
        >
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            {label && <p className="text-muted-foreground text-sm">{label}</p>}
        </div>
    );
}
