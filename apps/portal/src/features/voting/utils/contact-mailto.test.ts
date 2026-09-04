import { describe, expect, it } from "vitest";

import { buildContactMailto } from "./contact-mailto";

describe("buildContactMailto", () => {
    it("addresses every contact and pre-fills the vote title as subject", () => {
        expect(
            buildContactMailto(
                ["karel@example.com", "eva@example.com"],
                "Oprava střechy",
            ),
        ).toBe(
            "mailto:karel@example.com,eva@example.com?subject=Oprava%20st%C5%99echy",
        );
    });

    it("returns null when there is nobody to write to", () => {
        expect(buildContactMailto([], "Oprava střechy")).toBeNull();
    });
});
