import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { decideLoginFailure } from "./login-outcome";

const error = (code: string) => {
    const err = new AxiosError("failed");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    err.response = { data: { code } } as any;
    return err;
};

describe("decideLoginFailure", () => {
    it("sends an unverified account to the code screen", () => {
        // The password was right; the address was simply never proven. A red
        // toast would leave them with nothing to do.
        expect(decideLoginFailure(error("EMAIL_NOT_VERIFIED"))).toEqual({
            kind: "verify",
        });
    });

    it("shows every other failure as it is", () => {
        expect(decideLoginFailure(error("INVALID_CREDENTIALS"))).toEqual({
            kind: "show",
        });
    });

    it("shows a failure that carries no code at all", () => {
        expect(decideLoginFailure(new Error("network"))).toEqual({
            kind: "show",
        });
    });
});
