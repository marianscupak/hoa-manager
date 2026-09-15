import { describe, expect, it } from "vitest";

import type { KatastrImportPreviewResponseDto } from "@/api/generated/model";

import {
    extractKatastrErrorItems,
    katastrErrorMessages,
    stalePreviewFrom,
    translateCoded,
    translateKatastrError,
    type KatastrErrorBody,
    type Translate,
} from "./errors";

// A tiny stand-in for i18next: returns the interpolated template for a
// known key, or the key itself for an unknown one — exactly i18next's own
// missing-key behavior, which is what `translateKatastrError`'s fallback
// depends on.
const CATALOGUE: Record<string, string> = {
    "katastr:errors.NOT_A_KATASTR_DOCUMENT":
        "Tohle není výpis z katastru nemovitostí.",
    "katastr:errors.UNIT_NO_COLLISION":
        "Označení jednotky {{unitNo}} už v evidenci patří jiné jednotce.",
    "katastr:blockers.TRANSFER_ALREADY_SCHEDULED":
        "U jednotky {{unitNo}} je už naplánovaná změna vlastnictví.",
    "errors:UNKNOWN": "Nastala neočekávaná chyba. Zkuste to prosím později.",
};

const fakeT: Translate = (key, options) => {
    const template = CATALOGUE[key];
    if (template === undefined) return key;
    if (!options) return template;
    return Object.entries(options).reduce(
        (s, [k, v]) => s.replaceAll(`{{${k}}}`, String(v)),
        template,
    );
};

describe("extractKatastrErrorItems", () => {
    it("reads the errors array off a KATASTR_FILE_REJECTED body", () => {
        const body: KatastrErrorBody = {
            code: "KATASTR_FILE_REJECTED",
            errors: [{ code: "NOT_A_KATASTR_DOCUMENT" }],
        };
        expect(extractKatastrErrorItems(body)).toEqual([
            { code: "NOT_A_KATASTR_DOCUMENT" },
        ]);
    });

    it("reads the blockers array off a KATASTR_IMPORT_BLOCKED body", () => {
        const body: KatastrErrorBody = {
            code: "KATASTR_IMPORT_BLOCKED",
            blockers: [{ code: "UNIT_NO_COLLISION", unitNo: "132/1" }],
        };
        expect(extractKatastrErrorItems(body)).toEqual([
            { code: "UNIT_NO_COLLISION", unitNo: "132/1" },
        ]);
    });

    it("wraps a bare { code } that carries no errors/blockers of its own", () => {
        const body: KatastrErrorBody = { code: "FILE_TOO_LARGE" };
        expect(extractKatastrErrorItems(body)).toEqual([
            { code: "FILE_TOO_LARGE" },
        ]);
    });

    it("yields nothing for a body with no code at all (a bare 500)", () => {
        expect(extractKatastrErrorItems({})).toEqual([]);
        expect(extractKatastrErrorItems(undefined)).toEqual([]);
    });
});

describe("translateKatastrError", () => {
    it("translates a known code with its fields as interpolation variables", () => {
        expect(
            translateKatastrError(fakeT, {
                code: "UNIT_NO_COLLISION",
                unitNo: "132/1",
            }),
        ).toBe("Označení jednotky 132/1 už v evidenci patří jiné jednotce.");
    });

    it("falls back to the generic message for a code with no catalogue entry, never the code itself", () => {
        const message = translateKatastrError(fakeT, {
            code: "SOME_CODE_NOBODY_WROTE_COPY_FOR",
        });
        expect(message).toBe(
            "Nastala neočekávaná chyba. Zkuste to prosím později.",
        );
        expect(message).not.toMatch(/SOME_CODE_NOBODY_WROTE_COPY_FOR/);
    });
});

describe("katastrErrorMessages", () => {
    it("translates every item from an errors array", () => {
        expect(
            katastrErrorMessages(fakeT, {
                code: "KATASTR_FILE_REJECTED",
                errors: [{ code: "NOT_A_KATASTR_DOCUMENT" }],
            }),
        ).toEqual(["Tohle není výpis z katastru nemovitostí."]);
    });

    it("still produces exactly one message for a body with no code at all", () => {
        expect(katastrErrorMessages(fakeT, undefined)).toEqual([
            "Nastala neočekávaná chyba. Zkuste to prosím později.",
        ]);
    });

    it("never lets a code that exists on the wire but not in the catalogue reach the admin as itself", () => {
        const messages = katastrErrorMessages(fakeT, {
            code: "WHATEVER_THE_SERVER_SENDS_NEXT",
        });
        expect(messages).toHaveLength(1);
        expect(messages[0]).not.toMatch(/WHATEVER_THE_SERVER_SENDS_NEXT/);
        expect(messages[0]).toBe(
            "Nastala neočekávaná chyba. Zkuste to prosím později.",
        );
    });
});

describe("translateCoded", () => {
    it("translates a known blockers code with vars supplied separately from the code", () => {
        expect(
            translateCoded(fakeT, "blockers", "TRANSFER_ALREADY_SCHEDULED", {
                unitNo: "132/1",
            }),
        ).toBe("U jednotky 132/1 je už naplánovaná změna vlastnictví.");
    });

    it("falls back to the generic message for a blockers code with no catalogue entry, never the code itself", () => {
        // Reachable in practice: the apply-time re-check
        // (`validateOwnershipPlan`) emits its own codes — e.g.
        // DUPLICATE_OWNER, UNKNOWN_OWNER — which are a different set from
        // the five import-level `KATASTR_BLOCKER_CODES` and were never
        // added to the `blockers.*` catalogue.
        const message = translateCoded(fakeT, "blockers", "DUPLICATE_OWNER", {
            unitNo: "132/1",
        });
        expect(message).toBe(
            "Nastala neočekávaná chyba. Zkuste to prosím později.",
        );
        expect(message).not.toMatch(/DUPLICATE_OWNER/);
    });
});

describe("stalePreviewFrom", () => {
    // stalePreviewFrom never reads inside the plan, only whether one is
    // present, so a minimal stand-in is enough here.
    const fakePreview = {
        planHash: "fresh-hash",
    } as unknown as KatastrImportPreviewResponseDto;

    it("returns the fresh plan off a KATASTR_IMPORT_PLAN_STALE body", () => {
        expect(
            stalePreviewFrom({
                code: "KATASTR_IMPORT_PLAN_STALE",
                preview: fakePreview,
            }),
        ).toBe(fakePreview);
    });

    it("returns null for a KATASTR_IMPORT_PLAN_STALE body with no preview", () => {
        expect(
            stalePreviewFrom({ code: "KATASTR_IMPORT_PLAN_STALE" }),
        ).toBeNull();
    });

    it("returns null when a preview rides along with a different code", () => {
        expect(
            stalePreviewFrom({
                code: "KATASTR_IMPORT_BLOCKED",
                preview: fakePreview,
            }),
        ).toBeNull();
    });

    it("returns null for a body with no code at all", () => {
        expect(stalePreviewFrom(undefined)).toBeNull();
    });
});
