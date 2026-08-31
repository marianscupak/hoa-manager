import { cn } from "@hoa-mngr/ui/lib/utils";

import logoUrl from "@/assets/logo/logo-512.png";

export function BrandMark({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            <img src={logoUrl} alt="" className="h-7 w-7" />
            <span className="font-display text-foreground text-base font-extrabold tracking-tight">
                HOA Manager
            </span>
        </div>
    );
}
