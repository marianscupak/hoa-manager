import { describe, expect, it } from "vitest";

import { defaultSignerOwnerId, signerOptions } from "./signer-options";

const owners = [
    {
        ownerId: "a",
        displayName: "Alena",
        share: "1/2",
        isRepresentative: false,
    },
    {
        ownerId: "b",
        displayName: "Bedřich",
        share: "1/2",
        isRepresentative: true,
    },
];

describe("signerOptions", () => {
    it("lists the unit's owners with their shares", () => {
        expect(
            signerOptions({ owners, representative: null }).map(
                (o) => o.ownerId,
            ),
        ).toEqual(["a", "b"]);
    });

    it("adds a representative who owns no share of the unit", () => {
        const options = signerOptions({
            owners,
            representative: {
                ownerId: "x",
                membershipId: null,
                name: "Xaver",
                isUnitOwner: false,
            },
        });
        expect(options.at(-1)).toEqual({
            ownerId: "x",
            displayName: "Xaver",
            share: null,
            isRepresentative: true,
            isUnitOwner: false,
        });
    });

    it("does not duplicate a representative who is also an owner", () => {
        const options = signerOptions({
            owners,
            representative: {
                ownerId: "b",
                membershipId: null,
                name: "Bedřich",
                isUnitOwner: true,
            },
        });
        expect(options).toHaveLength(2);
    });

    it("ignores a delegate who is only a member (they vote in the app, not on paper)", () => {
        const options = signerOptions({
            owners,
            representative: {
                ownerId: null,
                membershipId: "m9",
                name: "Board",
                isUnitOwner: false,
            },
        });
        expect(options).toHaveLength(2);
    });

    it("returns no options for a unit with no owners and no representative", () => {
        expect(signerOptions({ owners: [], representative: null })).toEqual([]);
    });
});

describe("defaultSignerOwnerId", () => {
    it("preselects the representative", () => {
        expect(
            defaultSignerOwnerId(
                signerOptions({ owners, representative: null }),
            ),
        ).toBe("b");
    });

    it("selects nobody when no representative is offered", () => {
        expect(
            defaultSignerOwnerId(
                signerOptions({
                    owners: owners.map((o) => ({
                        ...o,
                        isRepresentative: false,
                    })),
                    representative: null,
                }),
            ),
        ).toBeNull();
    });
});
