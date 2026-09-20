import { describe, expect, it } from "vitest";

import { getUnitOwnershipInvalidationKeys } from "./invalidate-ownership-queries";

describe("getUnitOwnershipInvalidationKeys", () => {
    it("covers the unit's history and detail and the register list", () => {
        // Asserted against the literal URLs the generated helpers return
        // today rather than by re-calling those helpers, so a key that
        // silently stops matching — a route orval regenerates but this
        // list forgets to follow — fails here.
        expect(getUnitOwnershipInvalidationKeys("abc-123")).toEqual([
            ["/api/units/abc-123/ownership/history"],
            ["/api/units/abc-123"],
            ["/api/units"],
        ]);
    });

    it("includes the register list, which a period edit used to miss", () => {
        // The specific regression: moving an ownership period changes who
        // /units says owns the unit today, so that list must go stale too.
        expect(getUnitOwnershipInvalidationKeys("abc-123")).toContainEqual([
            "/api/units",
        ]);
    });
});
