import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
    extend: {
        theme: {
            text: ["detail", "title", "stat", "stat-lg"],
            radius: ["tile", "panel", "card", "card-lg"],
            shadow: [
                "clay-card",
                "clay-card-amber",
                "clay-card-destructive",
                "clay-hero",
                "clay-btn",
                "clay-btn-sm",
                "clay-btn-destructive",
                "clay-secondary",
                "clay-inset",
                "clay-inset-lg",
            ],
        },
    },
});

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
