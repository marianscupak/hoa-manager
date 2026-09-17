import { describe, expect, it } from "vitest";

import {
    remainingCooldownSeconds,
    RESEND_COOLDOWN_SECONDS,
} from "./resend-cooldown";

const NOW = new Date("2026-09-17T10:00:00Z");

describe("remainingCooldownSeconds", () => {
    it("is zero when nothing has been sent yet", () => {
        expect(remainingCooldownSeconds(null, NOW)).toBe(0);
    });

    it("counts down from the full window right after a send", () => {
        expect(remainingCooldownSeconds(NOW, NOW)).toBe(
            RESEND_COOLDOWN_SECONDS,
        );
    });

    it("rounds up, so the button never says 0 while it is still disabled", () => {
        const justUnder = new Date(NOW.getTime() + 500);
        expect(remainingCooldownSeconds(NOW, justUnder)).toBe(
            RESEND_COOLDOWN_SECONDS,
        );
    });

    it("is zero once the window has passed", () => {
        const after = new Date(NOW.getTime() + RESEND_COOLDOWN_SECONDS * 1000);
        expect(remainingCooldownSeconds(NOW, after)).toBe(0);
    });

    it("never goes negative", () => {
        const wayAfter = new Date(NOW.getTime() + 10 * 60 * 1000);
        expect(remainingCooldownSeconds(NOW, wayAfter)).toBe(0);
    });
});
