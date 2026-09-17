import { describe, expect, it } from "vitest";

import { renderVerificationCodeEmail } from "../index";

describe("verification code email", () => {
    it("carries the code and the expiry in both bodies", async () => {
        const email = await renderVerificationCodeEmail({
            code: "042137",
            expiresInMinutes: 15,
        });

        expect(email.html).toContain("042137");
        expect(email.text).toContain("042137");
        expect(email.text).toContain("15");
        expect(email.subject).toContain("042137");
    });
});
