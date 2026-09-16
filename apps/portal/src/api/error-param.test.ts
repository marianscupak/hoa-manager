import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { getApiErrorParam } from "./error-utils";

const error = (data: unknown) => {
    const err = new AxiosError("failed");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    err.response = { data } as any;
    return err;
};

describe("getApiErrorParam", () => {
    it("reads the value the message has a placeholder for", () => {
        // Without this the toast renders the literal "{{param}}" — which is
        // exactly what a message naming a date or an amount is for.
        expect(
            getApiErrorParam(
                error({
                    code: "ASSEMBLY_MEETING_BEFORE_OWNERSHIP_RECORDS",
                    details: [
                        {
                            code: "ASSEMBLY_MEETING_BEFORE_OWNERSHIP_RECORDS",
                            param: "2026-09-15",
                        },
                    ],
                }),
            ),
        ).toBe("2026-09-15");
    });

    it("takes the detail belonging to the code being shown", () => {
        // Schedule validation answers with a list; the toast renders one
        // message, so it must not pick a neighbour's value.
        expect(
            getApiErrorParam(
                error({
                    code: "VOTE_SCHEDULE_INVALID",
                    details: [
                        { code: "VOTE_MISSING_QUESTIONS" },
                        { code: "VOTE_SCHEDULE_INVALID", param: "2/3" },
                    ],
                }),
            ),
        ).toBe("2/3");
    });

    it("has nothing to give when no detail matches", () => {
        expect(
            getApiErrorParam(
                error({ code: "VOTE_NOT_FOUND", details: [{ code: "OTHER" }] }),
            ),
        ).toBeUndefined();
    });

    it("survives an error with no details at all", () => {
        expect(
            getApiErrorParam(error({ code: "VOTE_NOT_FOUND" })),
        ).toBeUndefined();
        expect(getApiErrorParam(new Error("boom"))).toBeUndefined();
    });
});
