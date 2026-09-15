import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import {
    getUnitColumns,
    UNITS_TABLE_GRID_TEMPLATE,
} from "./units-table-columns";

const fakeT = ((key: string) => key) as unknown as TFunction<"admin">;

describe("units table grid template", () => {
    it("has exactly one track per column", () => {
        // Regression test for the bug this pair guards against: a `usage`
        // column was added to getUnitColumns without a matching track in
        // the grid template, so the table's own action buttons rendered
        // under the unit number instead of in their own column. Deriving
        // the column count from getUnitColumns (rather than hardcoding 5)
        // means the next added or removed column fails this test the
        // moment the template goes out of sync, not in a screenshot.
        const columns = getUnitColumns(fakeT, () => {});
        const tracks = UNITS_TABLE_GRID_TEMPLATE.trim().split(/\s+/);

        expect(tracks).toHaveLength(columns.length);
    });
});
