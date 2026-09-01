import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
    it("keeps a text color alongside a custom text-size token", () => {
        expect(cn("text-destructive text-detail")).toBe(
            "text-destructive text-detail",
        );
    });

    it("lets a custom text-size token replace a built-in text-size class", () => {
        expect(cn("text-xs", "text-detail")).toBe("text-detail");
        expect(cn("text-sm", "text-title")).toBe("text-title");
    });

    it("merges custom radius tokens as a single conflict group", () => {
        expect(cn("rounded-panel", "rounded-card")).toBe("rounded-card");
        expect(cn("rounded-panel", "rounded")).toBe("rounded");
    });

    it("merges custom clay shadow tokens as a single conflict group", () => {
        expect(cn("shadow-clay-card", "shadow-clay-hero")).toBe(
            "shadow-clay-hero",
        );
    });

    it("merges a custom clay shadow with a built-in shadow size as one conflict group", () => {
        expect(cn("shadow-clay-card", "shadow-md")).toBe("shadow-md");
        expect(cn("shadow-md", "shadow-clay-card")).toBe("shadow-clay-card");
    });

    it("does not let a custom text-size token evict an unrelated text color", () => {
        expect(cn("text-muted-foreground", "text-stat")).toBe(
            "text-muted-foreground text-stat",
        );
    });
});
