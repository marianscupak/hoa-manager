import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Walks up from this file to the monorepo root (marked by
 * pnpm-workspace.yaml). Same helper as
 * features/admin/components/katastr-import/messages.test.ts, duplicated
 * rather than shared — each test anchors its own descent from wherever it
 * lives, not a path borrowed from an unrelated test file.
 */
function findRepoRoot(dir: string): string {
    let current = dir;
    while (!existsSync(join(current, "pnpm-workspace.yaml"))) {
        const parent = dirname(current);
        if (parent === current) {
            throw new Error(
                "could not find the repo root (no pnpm-workspace.yaml above " +
                    dir +
                    ")",
            );
        }
        current = parent;
    }
    return current;
}

const REPO_ROOT = findRepoRoot(dirname(fileURLToPath(import.meta.url)));
const PORTAL_SRC = join(REPO_ROOT, "apps/portal/src");
const OPENAPI_SPEC_PATH = join(REPO_ROOT, "apps/api/openapi-spec.json");

/**
 * Every `.ts`/`.tsx` file under `apps/portal/src`, except the orval-generated
 * clients: those are produced from the same spec this test checks against,
 * so they cannot drift from it the way a hand-written path can.
 */
function collectSourceFiles(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "generated") continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectSourceFiles(full));
        } else if (/\.tsx?$/.test(entry.name)) {
            files.push(full);
        }
    }
    return files;
}

/** Matches an axios request config's `url:` field, whichever quote style
 *  wraps it — template literal included, since a hand-written call may
 *  interpolate a path parameter (e.g. `` `/api/votes/${voteId}/ballots` ``). */
const URL_ASSIGNMENT = /url:\s*(?:`([^`]*)`|"([^"]*)"|'([^']*)')/g;

interface HandWrittenPath {
    path: string;
    file: string;
}

/**
 * Every `url:` string literal outside the generated clients and outside
 * test files (a mocked call in a test is not a real request). This is
 * exactly the surface that escaped detection when `/api` went missing from
 * katastr-import.ts's multipart helpers: no portal integration test goes
 * through HTTP routing, and the API's own tests call handlers directly, so
 * a hand-written path with a wrong prefix is invisible to both — until it
 * is compared against the spec here.
 */
function collectHandWrittenPaths(): HandWrittenPath[] {
    const found: HandWrittenPath[] = [];
    for (const file of collectSourceFiles(PORTAL_SRC)) {
        if (/\.test\.tsx?$/.test(file)) continue;
        const content = readFileSync(file, "utf8");
        for (const match of content.matchAll(URL_ASSIGNMENT)) {
            const path = match[1] ?? match[2] ?? match[3];
            if (path === undefined) continue;
            found.push({ path, file });
        }
    }
    return found;
}

/**
 * Collapses a path parameter to a single wildcard, however it is spelled —
 * `${voteId}` in a hand-written template literal, `{id}` in the OpenAPI
 * spec's path key. The two sides never agree on a parameter's *name* (the
 * code calls it `voteId`, the spec calls the same segment `id`), so
 * comparing raw strings would fail a correct path for the wrong reason;
 * comparing shapes does not.
 */
function normalize(path: string): string {
    return path.replace(/\$\{[^}]+\}/g, "*").replace(/\{[^}]+\}/g, "*");
}

describe("hand-written API paths", () => {
    it("all exist in the API's OpenAPI spec", () => {
        const spec = JSON.parse(readFileSync(OPENAPI_SPEC_PATH, "utf8")) as {
            paths: Record<string, unknown>;
        };
        const specPaths = new Set(
            Object.keys(spec.paths).map((path) => normalize(path)),
        );

        const handWritten = collectHandWrittenPaths();
        const foundPaths = new Set(handWritten.map((h) => h.path));

        // Pins the two concrete paths this test exists because of (Defect
        // 1: they were called without the API's global `/api` prefix), not
        // just "some paths were found" — a refactor that stops the regex
        // from seeing them (e.g. hoisting the literal into a named
        // constant) would otherwise let this test go on passing having
        // silently stopped checking anything.
        expect(foundPaths).toContain("/api/katastr-import/preview");
        expect(foundPaths).toContain("/api/katastr-import/apply");

        for (const { path, file } of handWritten) {
            expect(
                specPaths.has(normalize(path)),
                `${path} (in ${file}) is not a path in the API's OpenAPI spec`,
            ).toBe(true);
        }
    });
});
