import { describe, expect, it } from "vitest";

import { shouldAttemptRefresh } from "./refresh-policy";

describe("shouldAttemptRefresh", () => {
    it("does not refresh after a rejected login", () => {
        // A 401 here means the password is wrong, not that a token expired.
        // Refreshing anyway replaces INVALID_CREDENTIALS with the refresh
        // endpoint's own UNAUTHORIZED, which is what the user ends up reading.
        expect(shouldAttemptRefresh("/api/auth/login")).toBe(false);
    });

    it("does not refresh after the refresh itself is rejected", () => {
        expect(shouldAttemptRefresh("/api/auth/refresh")).toBe(false);
    });

    it("does not refresh after a rejected google exchange or logout", () => {
        expect(shouldAttemptRefresh("/api/auth/google/exchange")).toBe(false);
        expect(shouldAttemptRefresh("/api/auth/logout")).toBe(false);
    });

    it("refreshes for an access-token endpoint that happens to live under auth", () => {
        // switch-tenant carries AccessTokenAuthGuard, so its 401 really can
        // mean an expired token.
        expect(shouldAttemptRefresh("/api/auth/switch-tenant")).toBe(true);
    });

    it("refreshes for ordinary protected endpoints", () => {
        expect(shouldAttemptRefresh("/api/votes/abc-123")).toBe(true);
        expect(shouldAttemptRefresh("/api/units")).toBe(true);
    });

    it("refreshes when the url is unknown, keeping the protected-request default", () => {
        expect(shouldAttemptRefresh(undefined)).toBe(true);
    });

    it("ignores a query string on an exempt path", () => {
        expect(shouldAttemptRefresh("/api/auth/login?next=%2F")).toBe(false);
    });
});
