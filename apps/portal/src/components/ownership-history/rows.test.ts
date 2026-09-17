import { describe, expect, it } from "vitest";

import type { UnitOwnershipPeriodResponseDto } from "@/api/generated/model";

import {
    findScheduledPeriod,
    flattenPeriods,
    latestPeriodStart,
    periodLabel,
} from "./rows";

// Local-time constructors keep the expected strings independent of the
// machine's time zone.
const OCT_1 = new Date(2026, 9, 1).toISOString();
const MAR_15 = new Date(2020, 2, 15).toISOString();

const party = (id: string, name: string) => ({
    id,
    partyType: "SOLE" as const,
    shareNumerator: 1,
    shareDenominator: 1,
    shareDecimal: "1.0000",
    members: [
        { ownerId: `${id}-o`, displayName: name, kind: "PERSON" as const },
    ],
});

const PERIODS: UnitOwnershipPeriodResponseDto[] = [
    {
        validFrom: OCT_1,
        validTo: null,
        status: "SCHEDULED",
        parties: [party("n", "Novák")],
    },
    {
        validFrom: MAR_15,
        validTo: OCT_1,
        status: "ACTIVE",
        parties: [party("s1", "Svoboda"), party("s2", "Svobodová")],
    },
];

describe("flattenPeriods", () => {
    it("emits one row per party, keeping period order and carrying the period fields", () => {
        const rows = flattenPeriods(PERIODS);
        expect(rows.map((r) => r.id)).toEqual(["n", "s1", "s2"]);
        expect(rows[1]).toMatchObject({
            validFrom: MAR_15,
            validTo: OCT_1,
            status: "ACTIVE",
        });
    });

    it("returns no rows for undefined", () => {
        expect(flattenPeriods(undefined)).toEqual([]);
    });
});

describe("periodLabel", () => {
    it("reads 'od <date>' for an open period", () => {
        expect(periodLabel(OCT_1, null, "od")).toBe("od 1. 10. 2026");
    });

    it("shows the effective boundary date on both ends of a closed range", () => {
        expect(periodLabel(MAR_15, OCT_1, "od")).toBe(
            "15. 3. 2020 – 1. 10. 2026",
        );
    });
});

describe("findScheduledPeriod / latestPeriodStart", () => {
    it("finds the scheduled period and the newest start", () => {
        expect(findScheduledPeriod(PERIODS)?.validFrom).toBe(OCT_1);
        expect(latestPeriodStart(PERIODS)).toEqual(new Date(2026, 9, 1));
    });

    it("handles no periods", () => {
        expect(findScheduledPeriod([])).toBeUndefined();
        expect(latestPeriodStart(undefined)).toBeUndefined();
    });
});

describe("flattenPeriods period markers", () => {
    it("marks only the first row of each period, so a per-period action renders once", () => {
        const rows = flattenPeriods([
            {
                validFrom: "2026-01-01T00:00:00.000Z",
                validTo: null,
                status: "ACTIVE",
                parties: [party("p1", "A"), party("p2", "B")],
            },
            {
                validFrom: "2024-01-01T00:00:00.000Z",
                validTo: "2026-01-01T00:00:00.000Z",
                status: "CLOSED",
                parties: [party("p0", "C")],
            },
        ] as never);

        expect(rows.map((r) => r.isPeriodStart)).toEqual([true, false, true]);
    });
});
