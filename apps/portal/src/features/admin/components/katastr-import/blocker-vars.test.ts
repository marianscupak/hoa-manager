import { describe, expect, it } from "vitest";

import { blockerVars } from "./blocker-vars";

describe("blockerVars", () => {
    it("passes a calendar-day earliestAllowed straight through unchanged", () => {
        // The API sends a bare YYYY-MM-DD for EFFECTIVE_DATE_TOO_EARLY's
        // earliestAllowed (formatAssociationDate on the diff side — the
        // same fact C1 fixed for the top-level effectiveAt field), not an
        // instant, so no reduction happens here. A test asserting an ISO
        // instant round-trips to the right day would be the same
        // self-cancelling shape C1 called out elsewhere: it only passes
        // because the fixture happens to be UTC midnight, and it misleads
        // a reader into thinking the API ever sends an instant for this
        // field.
        expect(
            blockerVars({
                code: "EFFECTIVE_DATE_TOO_EARLY",
                unitNo: "133/2",
                earliestAllowed: "2026-01-01",
            }),
        ).toEqual({
            code: "EFFECTIVE_DATE_TOO_EARLY",
            unitNo: "133/2",
            earliestAllowed: "2026-01-01",
        });
    });

    it("reduces an ISO instant to the day defensively, for a field no shipped blocker sends one on", () => {
        // No current ImportBlocker carries a date field as a full instant
        // (see the test above) — but blockerVars still guards against one,
        // since an i18next date-only key must never receive a raw instant.
        // A made-up field/code, deliberately not earliestAllowed, keeps
        // this from implying otherwise.
        expect(
            blockerVars({
                code: "SOME_FUTURE_CODE",
                occurredAt: "2026-01-01T00:00:00.000Z",
            }),
        ).toEqual({
            code: "SOME_FUTURE_CODE",
            occurredAt: "2026-01-01",
        });
    });

    it("passes a name straight through", () => {
        expect(
            blockerVars({
                code: "AMBIGUOUS_NAME",
                name: "Jan Novák",
                registerOwnerIds: ["o1", "o2"],
                katastrPersonIds: ["p1"],
            }),
        ).toMatchObject({ name: "Jan Novák" });
    });

    it("drops array fields rather than interpolating them", () => {
        // i18next would render ["o1","o2"] as "o1,o2" — a list of database ids
        // in front of an admin, which says nothing and looks like a leak.
        const vars = blockerVars({
            code: "AMBIGUOUS_NAME",
            name: "Jan Novák",
            registerOwnerIds: ["o1", "o2"],
            katastrPersonIds: ["p1"],
        });
        expect(vars).not.toHaveProperty("registerOwnerIds");
        expect(vars).not.toHaveProperty("katastrPersonIds");
    });

    it("leaves a blocker with no special fields untouched", () => {
        expect(
            blockerVars({
                code: "TRANSFER_ALREADY_SCHEDULED",
                unitNo: "132/1",
            }),
        ).toEqual({ code: "TRANSFER_ALREADY_SCHEDULED", unitNo: "132/1" });
    });
});
