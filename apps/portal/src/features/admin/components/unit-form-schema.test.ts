import { describe, expect, it } from "vitest";

import { unitFormSchema } from "./unit-form-schema";

describe("unitFormSchema", () => {
    it("accepts a unit number with a building share fraction", () => {
        const result = unitFormSchema.safeParse({
            unitNo: "1",
            buildingShare: { num: 3200, den: 10000 },
        });
        expect(result.success).toBe(true);
    });

    it("reports a missing share under the shareInvalid key", () => {
        const result = unitFormSchema.safeParse({
            unitNo: "1",
            buildingShare: null,
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]).toMatchObject({
            path: ["buildingShare"],
            message: "admin:units.create.shareInvalid",
        });
    });

    it("still requires the unit number", () => {
        const result = unitFormSchema.safeParse({
            unitNo: "",
            buildingShare: { num: 1, den: 1 },
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(["unitNo"]);
    });
});
