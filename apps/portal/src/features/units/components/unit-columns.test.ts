import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import { getUnitColumns, unitsGridTemplate } from "./unit-columns";

const fakeT = ((key: string) => key) as unknown as TFunction<
    ["common", "admin"]
>;

const ids = (opts: { canManage: boolean; showMyShare: boolean }) =>
    getUnitColumns(fakeT, { ...opts, onDelete: () => {} }).map((c) => c.id);

describe("getUnitColumns", () => {
    it("gives the board the management actions and no personal share", () => {
        expect(ids({ canManage: true, showMyShare: false })).toEqual([
            "unitNo",
            "usage",
            "share",
            "owners",
            "actions",
        ]);
    });

    it("shows an owner their own share in the unit", () => {
        expect(ids({ canManage: false, showMyShare: true })).toContain(
            "myShare",
        );
    });

    it("leaves the personal share out for someone who owns nothing", () => {
        // An empty column explains nothing.
        expect(ids({ canManage: false, showMyShare: false })).not.toContain(
            "myShare",
        );
    });

    it("keeps the register readable to a board member who also owns a unit", () => {
        expect(ids({ canManage: true, showMyShare: true })).toEqual([
            "unitNo",
            "usage",
            "share",
            "owners",
            "myShare",
            "actions",
        ]);
    });
});

describe("unitsGridTemplate", () => {
    it.each([
        { canManage: true, showMyShare: false },
        { canManage: true, showMyShare: true },
        { canManage: false, showMyShare: false },
        { canManage: false, showMyShare: true },
    ])("has one track per column for %o", (opts) => {
        // The pair drifted once already: a column was added without a track,
        // and the action buttons rendered under the unit number.
        const columns = getUnitColumns(fakeT, { ...opts, onDelete: () => {} });
        const tracks = unitsGridTemplate(opts).trim().split(/\s+/);

        expect(tracks).toHaveLength(columns.length);
    });
});
