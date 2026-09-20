import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { audit as cs } from "@/i18n/locales/cs/audit";
import { audit as en } from "@/i18n/locales/en/audit";
import { findRepoRoot } from "@/test-support/repo-root";

import { KNOWN_EVENT_TYPES } from "./event-type-meta";

/**
 * The API's two event-type unions, read as source rather than imported —
 * apps/portal and apps/api are separate deployable apps. Both files are
 * plain `as const` maps of `NAME: 'NAMESPACE.NAME'`, so the qualified
 * values are all this needs.
 *
 * What this buys: an event added on the API side and nowhere else shows up
 * in the timeline as a grey circle captioned "Event", which is how
 * `CORE.OWNERSHIP_PERIOD_UPDATED` and `CORE.OWNER_RENAMED` both reached
 * production. Silent, and invisible until someone triggers that event.
 */
const REPO_ROOT = findRepoRoot(dirname(fileURLToPath(import.meta.url)));

const SOURCES = [
    "apps/api/src/modules/core/audit-projections/core-event-types.ts",
    "apps/api/src/modules/voting/audit/voting-event-types.ts",
];

function apiEventTypes(): string[] {
    return SOURCES.flatMap((relative) => {
        const source = readFileSync(join(REPO_ROOT, relative), "utf8");
        const matches = source.matchAll(/'((?:CORE|VOTING)\.[A-Z0-9_]+)'/g);
        return [...matches].map((match) => match[1]);
    });
}

/** "CORE.UNIT_CREATED" → ["CORE", "UNIT_CREATED"] */
function split(eventType: string): [keyof typeof en, string] {
    const [namespace, ...rest] = eventType.split(".");
    return [namespace as keyof typeof en, rest.join(".")];
}

describe("audit event type coverage", () => {
    const eventTypes = apiEventTypes();

    it("found the API's event types at all", () => {
        // Guards the regex and the two paths above: if either goes stale
        // this suite would otherwise pass by asserting nothing.
        expect(eventTypes.length).toBeGreaterThan(30);
        expect(eventTypes).toContain("CORE.OWNERSHIP_PERIOD_UPDATED");
        expect(eventTypes).toContain("VOTING.VOTE_CREATED");
    });

    it("draws an icon for every event the API can emit", () => {
        expect([...KNOWN_EVENT_TYPES].sort()).toEqual([...eventTypes].sort());
    });

    it("names every event in both languages", () => {
        for (const eventType of eventTypes) {
            const [namespace, name] = split(eventType);
            expect(
                (en[namespace] as Record<string, string>)[name],
                `en.${eventType}`,
            ).toBeTruthy();
            expect(
                (cs[namespace] as Record<string, string>)[name],
                `cs.${eventType}`,
            ).toBeTruthy();
        }
    });
});
