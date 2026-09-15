import { describe, expect, it } from "vitest";

import { capitalizeFirst } from "./capitalize-first";

describe("capitalizeFirst", () => {
    it("uppercases the first letter of a translated value", () => {
        expect(capitalizeFirst("flat")).toBe("Flat");
    });

    it("uppercases only the first letter of a multi-word fallback, leaving the rest of the words alone", () => {
        expect(capitalizeFirst("jiný nebytový prostor")).toBe(
            "Jiný nebytový prostor",
        );
    });

    it("returns an empty string unchanged", () => {
        expect(capitalizeFirst("")).toBe("");
    });
});
