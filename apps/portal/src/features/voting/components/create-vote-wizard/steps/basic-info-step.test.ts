import { describe, expect, it } from "vitest";

import { buildFormSchema } from "./basic-info-step";

const DAY_MS = 24 * 60 * 60 * 1000;

function at(days: number): string {
    return new Date(Date.now() + days * DAY_MS).toISOString();
}

function errorsFor(
    mode: "PER_ROLLAM" | "ASSEMBLY_RECORD",
    scheduledFrom: string,
    scheduledTo: string,
): string[] {
    const result = buildFormSchema(mode).safeParse({
        title: "Test vote",
        description: "",
        scheduledFrom,
        scheduledTo,
    });
    return result.success ? [] : result.error.issues.map((i) => i.message);
}

describe("buildFormSchema", () => {
    it("rejects a closing date that falls before the opening date", () => {
        // Both modes: the checklist no longer carries this, so the form has
        // to be the thing that catches it.
        for (const mode of ["PER_ROLLAM", "ASSEMBLY_RECORD"] as const) {
            expect(errorsFor(mode, at(20), at(2))).toContain(
                "voting:create.fields.scheduledTo.errors.beforeStart",
            );
        }
    });

    it("rejects a per rollam window shorter than 15 days", () => {
        expect(errorsFor("PER_ROLLAM", at(2), at(12))).toContain(
            "voting:create.fields.scheduledTo.errors.tooShortPerRollam",
        );
    });

    it("accepts a short window for an assembly record", () => {
        expect(errorsFor("ASSEMBLY_RECORD", at(2), at(3))).toEqual([]);
    });

    it("accepts a per rollam window of exactly 15 days", () => {
        expect(errorsFor("PER_ROLLAM", at(2), at(17))).toEqual([]);
    });

    it("stays quiet while the dates are still blank", () => {
        expect(errorsFor("PER_ROLLAM", "", "")).toEqual([]);
    });
});
