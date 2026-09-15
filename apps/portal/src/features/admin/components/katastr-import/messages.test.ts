import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import cs from "@/i18n/locales/cs/katastr";
import en from "@/i18n/locales/en/katastr";

import {
    KATASTR_BLOCKER_CODES,
    KATASTR_ERROR_CODES,
    KATASTR_WARNING_CODES,
} from "./messages";

/**
 * Walks up from this file to the monorepo root (marked by
 * pnpm-workspace.yaml), so the descent into the API's katastr domain folder
 * below is the only path that can ever go stale, not this traversal.
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

/**
 * The single list both this test and the API's `katastr-error-codes.spec.ts`
 * assert against — see that file, and `katastr-error-codes.json`'s own
 * `_comment`, for why it lives on the API side and how the API's own union
 * types are tied to it. This is a plain `fs` read of a checked-in JSON data
 * file, not a cross-app module import: the portal cannot import
 * `KatastrParseErrorCode` / `ImportBlockerCode` / `ImportWarningCode`
 * directly, since apps/portal and apps/api are separate deployable apps.
 */
const REPO_ROOT = findRepoRoot(dirname(fileURLToPath(import.meta.url)));
const CATALOGUE = JSON.parse(
    readFileSync(
        join(
            REPO_ROOT,
            "apps/api/src/modules/core/property/domain/katastr/katastr-error-codes.json",
        ),
        "utf8",
    ),
) as {
    errorCodes: string[];
    blockerCodes: string[];
    warningCodes: string[];
};

describe("katastr message catalogue", () => {
    it("matches the API's checked-in code catalogue", () => {
        // The property this proves: adding a code to KatastrParseError /
        // ImportBlocker / ImportWarning on the API side without updating
        // katastr-error-codes.json fails katastr-error-codes.spec.ts;
        // adding a code to KATASTR_ERROR_CODES / KATASTR_BLOCKER_CODES /
        // KATASTR_WARNING_CODES here without updating that same file fails
        // this assertion. Either direction, a code added on one side alone
        // fails a test.
        expect([...KATASTR_ERROR_CODES].sort()).toEqual(
            [...CATALOGUE.errorCodes].sort(),
        );
        expect([...KATASTR_BLOCKER_CODES].sort()).toEqual(
            [...CATALOGUE.blockerCodes].sort(),
        );
        expect([...KATASTR_WARNING_CODES].sort()).toEqual(
            [...CATALOGUE.warningCodes].sort(),
        );
    });

    it("covers every catalogue code in both languages", () => {
        for (const code of KATASTR_ERROR_CODES) {
            expect(cs.errors[code], `cs.errors.${code}`).toBeTruthy();
            expect(en.errors[code], `en.errors.${code}`).toBeTruthy();
        }
        for (const code of KATASTR_BLOCKER_CODES) {
            expect(cs.blockers[code], `cs.blockers.${code}`).toBeTruthy();
            expect(en.blockers[code], `en.blockers.${code}`).toBeTruthy();
        }
        for (const code of KATASTR_WARNING_CODES) {
            expect(cs.warnings[code], `cs.warnings.${code}`).toBeTruthy();
            expect(en.warnings[code], `en.warnings.${code}`).toBeTruthy();
        }
    });

    it("has the same key structure in both languages", () => {
        // i18next plural suffixes are language-specific, and which
        // categories a language distinguishes for integers is a fact about
        // that language, not something this test should assume — ask the
        // platform (Intl.PluralRules) rather than hardcoding "Czech needs
        // one/few/other". Two assertions:
        //   1. The set of base keys (plural suffixes collapsed) matches
        //      across languages — catches an entirely missing key.
        //   2. Every base key that is pluralized in either language carries
        //      EXACTLY the suffixes its own language's integer plural rule
        //      requires — catches a single missing plural form, e.g.
        //      deleting cs.table.count_one while count_few/count_other
        //      survive (a strip-and-dedupe-only version of this test does
        //      not catch that: the base key "table.count" still "exists"
        //      via a sibling suffix).
        const PLURAL_SUFFIX = /^(.*)_(zero|one|two|few|many|other)$/;

        /** The plural categories a language actually distinguishes for
         *  integers (probed with representative magnitudes; Czech needs
         *  1, 2-4, and 5+, English only 1 vs everything else). */
        const integerCategories = (lang: string): Set<string> => {
            const rules = new Intl.PluralRules(lang);
            return new Set(
                [0, 1, 2, 3, 4, 5, 11, 21, 100].map((n) => rules.select(n)),
            );
        };

        /** Maps each leaf's base path (plural suffix stripped, if any) to
         *  the set of suffixes found there — `null` for a plain,
         *  unsuffixed leaf. */
        const collectBaseKeys = (
            o: object,
            prefix = "",
        ): Map<string, Set<string | null>> => {
            const result = new Map<string, Set<string | null>>();
            for (const [k, v] of Object.entries(o)) {
                if (typeof v === "object" && v !== null) {
                    for (const [base, suffixes] of collectBaseKeys(
                        v,
                        `${prefix}${k}.`,
                    )) {
                        result.set(base, suffixes);
                    }
                    continue;
                }
                const match = PLURAL_SUFFIX.exec(k);
                const base = match ? `${prefix}${match[1]}` : `${prefix}${k}`;
                const suffix = match ? match[2] : null;
                const existing = result.get(base) ?? new Set<string | null>();
                existing.add(suffix);
                result.set(base, existing);
            }
            return result;
        };

        const csKeys = collectBaseKeys(cs);
        const enKeys = collectBaseKeys(en);

        // 1. Same base keys on both sides — a genuinely missing key fails
        // here regardless of whether it was ever pluralized.
        expect([...csKeys.keys()].sort()).toEqual([...enKeys.keys()].sort());

        // 2. Every pluralized base key carries exactly its own language's
        // integer categories — not the other language's, not a subset.
        const csIntegerCategories = integerCategories("cs");
        const enIntegerCategories = integerCategories("en");
        for (const [base, csSuffixes] of csKeys) {
            const enSuffixes = enKeys.get(base)!;
            const isPluralized =
                [...csSuffixes].some((s) => s !== null) ||
                [...enSuffixes].some((s) => s !== null);
            if (!isPluralized) continue;

            expect(csSuffixes, `cs.${base} plural forms`).toEqual(
                csIntegerCategories,
            );
            expect(enSuffixes, `en.${base} plural forms`).toEqual(
                enIntegerCategories,
            );
        }
    });
});
