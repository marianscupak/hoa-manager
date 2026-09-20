import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import cs from "@/i18n/locales/cs/errors";
import en from "@/i18n/locales/en/errors";
import { findRepoRoot } from "@/test-support/repo-root";

/**
 * The API's `ErrorCode` map, read as source — apps/portal and apps/api are
 * separate deployable apps, so the portal cannot import it.
 *
 * What this buys: `showApiError` looks up `errors:<CODE>`, and a code with
 * no entry here reaches the user as itself. `OWNERSHIP_PERIOD_OVERLAPS`
 * was toasted as "OWNERSHIP_PERIOD_OVERLAPS" for exactly that reason, and
 * fourteen more codes were one throw away from the same.
 */
const REPO_ROOT = findRepoRoot(dirname(fileURLToPath(import.meta.url)));

function apiErrorCodes(): string[] {
    const source = readFileSync(
        join(REPO_ROOT, "apps/api/src/shared/errors/error-codes.ts"),
        "utf8",
    );
    // Only the `ErrorCode` map itself; the HTTP-status map below it repeats
    // every name as `[ErrorCode.X]:` and would double the list.
    const map = source.slice(
        source.indexOf("ErrorCode = {"),
        source.indexOf("} as const"),
    );
    return [...map.matchAll(/^ {2}([A-Z0-9_]+):/gm)].map((m) => m[1]);
}

describe("API error code coverage", () => {
    const codes = apiErrorCodes();

    it("found the API's codes at all", () => {
        // Guards the path and the regex: without this the suite could pass
        // by asserting over an empty list.
        expect(codes.length).toBeGreaterThan(50);
        expect(codes).toContain("OWNERSHIP_PERIOD_OVERLAPS");
    });

    it("has a message for every code, in both languages", () => {
        const missing = (catalogue: Record<string, unknown>) =>
            codes.filter((code) => !catalogue[code]);

        expect(missing(en), "codes with no English message").toEqual([]);
        expect(missing(cs), "codes with no Czech message").toEqual([]);
    });

    it("keeps the generic fallback both languages need", () => {
        // `showApiError` passes this as i18next's `defaultValue`, so it is
        // what a brand-new API code reads as until someone writes its copy.
        expect(en.UNKNOWN).toBeTruthy();
        expect(cs.UNKNOWN).toBeTruthy();
    });
});
