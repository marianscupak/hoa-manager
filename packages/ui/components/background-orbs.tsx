import { cn } from "../lib/utils";

export function BackgroundOrbs({ className }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={cn(
                "pointer-events-none absolute inset-0 overflow-hidden",
                className,
            )}
        >
            <div className="absolute -top-25 -left-25 h-85 w-85 rounded-full bg-[rgba(124,58,237,0.12)] blur-[64px]" />
            <div className="absolute top-30 -right-25 h-80 w-80 rounded-full bg-[rgba(245,158,11,0.12)] blur-[64px]" />
        </div>
    );
}
