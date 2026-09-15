import type { KatastrCoded } from "./messages";

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T/;

/**
 * Interpolation variables for a blocker's message. Scalars pass through so a
 * new field on a code needs no portal change; arrays are dropped, because
 * i18next would render one as a comma-joined list of database ids.
 */
export function blockerVars(blocker: KatastrCoded): Record<string, string> {
    const vars: Record<string, string> = {};
    for (const [key, value] of Object.entries(blocker)) {
        if (Array.isArray(value)) continue;
        if (typeof value === "string" && ISO_INSTANT.test(value)) {
            vars[key] = value.slice(0, 10);
            continue;
        }
        if (value === null || value === undefined) continue;
        vars[key] = String(value);
    }
    return vars;
}
