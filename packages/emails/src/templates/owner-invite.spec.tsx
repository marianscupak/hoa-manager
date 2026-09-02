import { describe, expect, it } from "vitest";

import { renderOwnerInviteEmail } from "../index";

const LINK = "https://hoa.example.cz/invites/owner?token=abc123";
const TENANT = "SVJ Květná 12";
const PROPS = { tenantName: TENANT, inviteLink: LINK, expiresInHours: 72 };

describe("renderOwnerInviteEmail", () => {
    it("puts the tenant name in the subject", async () => {
        const { subject } = await renderOwnerInviteEmail(PROPS);
        expect(subject).toBe("Pozvánka do portálu SVJ Květná 12");
    });

    it("links the invite URL in the HTML body", async () => {
        const { html } = await renderOwnerInviteEmail(PROPS);
        expect(html).toContain(`href="${LINK}"`);
        expect(html).toContain(TENANT);
        expect(html).toContain("Přijmout pozvánku");
    });

    it("includes the invite URL and expiry in the plain-text body", async () => {
        const { text } = await renderOwnerInviteEmail(PROPS);
        expect(text).toContain(LINK);
        expect(text).toContain("72 hodin");
    });

    it("keeps the preheader out of the plain-text body", async () => {
        const { text } = await renderOwnerInviteEmail(PROPS);
        expect(text).not.toContain("Dokončete registraci");
    });

    it("escapes HTML in the tenant name", async () => {
        const { html } = await renderOwnerInviteEmail({
            ...PROPS,
            tenantName: "A & B <script>",
        });
        expect(html).toContain("A &amp; B &lt;script&gt;");
        expect(html).not.toContain("<script>");
    });
});
