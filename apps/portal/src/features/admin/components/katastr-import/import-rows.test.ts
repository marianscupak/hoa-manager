import { describe, expect, it } from "vitest";

import type { KatastrImportPreviewResponseDto } from "@/api/generated/model";

import {
    buildImportRows,
    describeOwnership,
    ownersNeedingALook,
    unitDetailParts,
    visibleImportRows,
} from "./import-rows";

type PreviewUnit = KatastrImportPreviewResponseDto["units"][number];
type PreviewOwner = KatastrImportPreviewResponseDto["owners"][number];

const JOIN = " and ";

function unit(over: Partial<PreviewUnit> = {}): PreviewUnit {
    return {
        unitNo: "1",
        action: "UPDATE",
        unitNoChange: null,
        shareChange: null,
        usageChange: null,
        ownershipChange: null,
        ...over,
    };
}

function preview(
    over: Partial<KatastrImportPreviewResponseDto> = {},
): KatastrImportPreviewResponseDto {
    return {
        planHash: "hash",
        effectiveAt: "2026-09-12",
        document: {
            validAt: "2026-09-12",
            issuedAt: "2026-09-15",
            lvNumber: "4132",
            municipality: "Praha",
            cadastralArea: "Vinohrady",
        },
        counts: {
            unitsCreated: 0,
            unitsUpdated: 0,
            unitsUnchanged: 0,
            ownersCreated: 0,
            ownersMatched: 0,
        },
        units: [],
        owners: [],
        unitsNotInFile: [],
        ownersNotInFile: [],
        warnings: [],
        blockers: [],
        ...over,
    };
}

function owner(action: PreviewOwner["action"], name: string): PreviewOwner {
    return {
        displayName: name,
        ico: null,
        kind: "PERSON",
        action,
        existingDisplayName: null,
        existingEmail: null,
        existingHasAccount: false,
    };
}

describe("describeOwnership", () => {
    it("joins the two names of a marital community with the catalogue's word", () => {
        expect(
            describeOwnership(
                [
                    {
                        partyType: "SJM",
                        share: "1/2",
                        memberNames: ["Novák Petr", "Nováková Jana"],
                    },
                    {
                        partyType: "SOLE",
                        share: "1/2",
                        memberNames: ["Říha Karel"],
                    },
                ],
                JOIN,
            ),
        ).toBe("Novák Petr and Nováková Jana (1/2), Říha Karel (1/2)");
    });
});

describe("unitDetailParts", () => {
    it("emits one part per changed field, in a fixed reading order", () => {
        const parts = unitDetailParts(
            unit({
                unitNoChange: { from: "1178/4", to: "1178/4a" },
                shareChange: { from: "1/20", to: "1/18" },
                usageChange: { from: "byt", to: "ateliér" },
            }),
            JOIN,
        );

        expect(parts).toEqual([
            { field: "unitNo", from: "1178/4", to: "1178/4a" },
            { field: "share", from: "1/20", to: "1/18" },
            { field: "usage", from: "byt", to: "ateliér" },
        ]);
    });

    it("leaves `from` null when ownership is being recorded for the first time", () => {
        const parts = unitDetailParts(
            unit({
                action: "CREATE",
                ownershipChange: {
                    from: [],
                    to: [
                        {
                            partyType: "SOLE",
                            share: "1/1",
                            memberNames: ["Říha Karel"],
                        },
                    ],
                },
            }),
            JOIN,
        );

        expect(parts).toEqual([
            { field: "ownership", from: null, to: "Říha Karel (1/1)" },
        ]);
    });

    it("shows a cleared usage as an em-dash rather than an empty value", () => {
        expect(
            unitDetailParts(
                unit({ usageChange: { from: "byt", to: null } }),
                JOIN,
            ),
        ).toEqual([{ field: "usage", from: "byt", to: "—" }]);
    });

    it("returns nothing for a unit the file does not change", () => {
        expect(unitDetailParts(unit({ action: "UNCHANGED" }), JOIN)).toEqual(
            [],
        );
    });

    it("treats the empty `from` a create carries as nothing to strike out", () => {
        expect(
            unitDetailParts(
                unit({
                    action: "CREATE",
                    shareChange: { from: "", to: "6342/206422" },
                }),
                JOIN,
            ),
        ).toEqual([{ field: "share", from: null, to: "6342/206422" }]);
    });
});

describe("buildImportRows", () => {
    it("orders creates, then updates, then unchanged, then units the file omits", () => {
        const rows = buildImportRows(
            preview({
                units: [
                    unit({ unitNo: "3", action: "UNCHANGED" }),
                    unit({ unitNo: "1", action: "UPDATE" }),
                    unit({ unitNo: "2", action: "CREATE" }),
                ],
                unitsNotInFile: [{ unitNo: "9" }],
            }),
            JOIN,
        );

        expect(rows.map((row) => row.unitNo)).toEqual(["2", "1", "3", "9"]);
        expect(rows.map((row) => row.action)).toEqual([
            "CREATE",
            "UPDATE",
            "UNCHANGED",
            "NOT_IN_FILE",
        ]);
    });

    it("keeps the API's order within a group", () => {
        const rows = buildImportRows(
            preview({
                units: [
                    unit({ unitNo: "12", action: "CREATE" }),
                    unit({ unitNo: "4", action: "CREATE" }),
                    unit({ unitNo: "7", action: "CREATE" }),
                ],
            }),
            JOIN,
        );

        expect(rows.map((row) => row.unitNo)).toEqual(["12", "4", "7"]);
    });
});

describe("visibleImportRows", () => {
    const rows = buildImportRows(
        preview({
            units: [
                unit({ unitNo: "1", action: "CREATE" }),
                unit({ unitNo: "2", action: "UNCHANGED" }),
            ],
            unitsNotInFile: [{ unitNo: "9" }],
        }),
        JOIN,
    );

    it("hides unchanged rows by default but never the ones the file omits", () => {
        expect(visibleImportRows(rows, false).map((row) => row.unitNo)).toEqual(
            ["1", "9"],
        );
    });

    it("reveals unchanged rows on request", () => {
        expect(visibleImportRows(rows, true).map((row) => row.unitNo)).toEqual([
            "1",
            "2",
            "9",
        ]);
    });
});

describe("ownersNeedingALook", () => {
    it("keeps new owners and name matches, drops the exact matches", () => {
        const owners = [
            owner("CREATE", "Nový Jan"),
            owner("MATCHED_BY_NAME", "Říha Karel"),
            owner("MATCHED_BY_KATASTR_ID", "Novák Petr"),
            owner("MATCHED_BY_ICO", "Správa domu s.r.o."),
        ];

        expect(
            ownersNeedingALook(owners).map((entry) => entry.displayName),
        ).toEqual(["Nový Jan", "Říha Karel"]);
    });
});
