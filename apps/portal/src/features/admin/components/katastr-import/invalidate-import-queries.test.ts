import type { QueryKey } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import {
    getKatastrImportInvalidationKeys,
    isUnitScopedQuery,
} from "./invalidate-import-queries";

describe("getKatastrImportInvalidationKeys", () => {
    it("returns the owners, property overview, and activity timeline keys", () => {
        // Asserted against the literal URLs the generated helpers are known
        // to return today (see property-owners.ts, property.ts, audit.ts),
        // not by re-calling those same helpers — a key that silently stops
        // matching (a route rename orval regenerates but this list forgets
        // to follow) should fail here.
        expect(getKatastrImportInvalidationKeys()).toEqual([
            ["/api/owners"],
            ["/api/property/overview"],
            ["/api/audit/activity"],
        ]);
    });
});

describe("isUnitScopedQuery", () => {
    it.each<[string, QueryKey, boolean]>([
        ["the units list itself", ["/api/units"], true],
        ["a specific unit's detail", ["/api/units/abc-123"], true],
        [
            "a specific unit's ownership history",
            ["/api/units/abc-123/ownership/history"],
            true,
        ],
        ["the current user's owned units", ["/api/units/mine"], true],
        ["the owners list", ["/api/owners"], false],
        ["the property overview", ["/api/property/overview"], false],
        [
            "an unrelated endpoint that merely shares the prefix character-for-character up to the boundary",
            ["/api/units-other"],
            false,
        ],
        ["a non-string first key element", [{ scope: "units" }], false],
    ])("%s -> %s", (_description, queryKey, expected) => {
        expect(isUnitScopedQuery(queryKey)).toBe(expected);
    });
});
