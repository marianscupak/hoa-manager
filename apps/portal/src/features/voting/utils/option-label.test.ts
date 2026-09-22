import { describe, expect, it } from "vitest";

import { getOptionLabel, resolveAnswerOptionKey } from "./option-label";

// `getOptionLabel` takes a real i18next `TFunction`; the test only cares
// which key it asks for, so the identity function stands in for it.
const t = ((key: string) => key) as never;

describe("getOptionLabel", () => {
    it("translates the three standard options by their key, not their stored label", () => {
        expect(getOptionLabel("YES", "YES", t)).toBe("castVote.options.yes");
        expect(getOptionLabel("NO", "NO", t)).toBe("castVote.options.no");
        expect(getOptionLabel("ABSTAIN", "ABSTAIN", t)).toBe(
            "castVote.options.abstain",
        );
    });

    it("keeps a custom option's own label", () => {
        expect(getOptionLabel("CUSTOM", "Modrá fasáda", t)).toBe(
            "Modrá fasáda",
        );
    });
});

describe("resolveAnswerOptionKey", () => {
    it("uses the recorded key when the audit entry carries one", () => {
        expect(
            resolveAnswerOptionKey({ optionKey: "NO", optionText: "NO" }),
        ).toBe("NO");
    });

    it("recovers the key from the stored label on entries written before the key was recorded", () => {
        expect(resolveAnswerOptionKey({ optionText: "YES" })).toBe("YES");
        expect(resolveAnswerOptionKey({ optionText: "ABSTAIN" })).toBe(
            "ABSTAIN",
        );
    });

    it("treats any other label on an old entry as a custom option", () => {
        expect(resolveAnswerOptionKey({ optionText: "Modrá fasáda" })).toBe(
            "CUSTOM",
        );
    });
});
