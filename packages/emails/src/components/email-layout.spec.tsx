import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";

import { EmailLayout } from "./email-layout";

describe("EmailLayout", () => {
    it("renders a Czech, light-only document with the preheader and wordmark", async () => {
        const html = await render(
            <EmailLayout preview="Náhled zprávy">
                <p>Obsah zprávy</p>
            </EmailLayout>,
        );

        expect(html).toContain('lang="cs"');
        expect(html).toContain("Náhled zprávy");
        expect(html).toContain('name="color-scheme" content="light"');
        expect(html).toContain(
            'name="supported-color-schemes" content="light"',
        );
        expect(html).toContain("HOA Manager");
        expect(html).toContain("Obsah zprávy");
        expect(html).toContain("@font-face");
        expect(html).toContain("Nunito");
        expect(html).not.toContain("* {");
        expect(html).toMatch(/<td[^>]*style="[^"]*padding:32px/);
    });

    it("shows the footer note when given", async () => {
        const html = await render(
            <EmailLayout
                preview="Náhled"
                footerNote="Proč jste tento e-mail dostali."
            >
                <p>Obsah</p>
            </EmailLayout>,
        );

        expect(html).toContain("Proč jste tento e-mail dostali.");
    });

    it("keeps the preheader out of the plain-text rendering", async () => {
        const text = await render(
            <EmailLayout preview="Skrytý náhled">
                <p>Viditelný obsah</p>
            </EmailLayout>,
            { plainText: true },
        );

        expect(text).toContain("Viditelný obsah");
        expect(text).not.toContain("Skrytý náhled");
    });
});
