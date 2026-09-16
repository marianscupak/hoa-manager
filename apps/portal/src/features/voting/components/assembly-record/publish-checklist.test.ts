import { describe, expect, it } from "vitest";

import type {
    AssemblyRecordResponseDto,
    AssemblyRecordTotalsDto,
} from "@/api/generated/model";

import { buildPublishChecks } from "./publish-checklist";

const FRACTION = { num: "1", den: "1", decimal: "1.0000" };

function record(
    overrides: Partial<AssemblyRecordTotalsDto> & {
        unitCount?: number;
        meetingDate?: string | null;
    } = {},
): AssemblyRecordResponseDto {
    const {
        unitCount = 20,
        meetingDate = "2026-09-12T18:30:00.000Z",
        ...totals
    } = overrides;

    return {
        voteTitle: "Podzimní shromáždění",
        status: "DRAFT",
        meetingDate,
        weightBasis: "UNIT_SHARE",
        totals: {
            allVotesWeight: FRACTION,
            presentWeight: FRACTION,
            presentUnitCount: 14,
            absentUnitCount: 4,
            ineligibleUnitCount: 2,
            unitsAwaitingEntry: 0,
            quorate: true,
            ...totals,
        },
        units: Array.from({ length: unitCount }, (_, i) => ({
            unitId: `u${i}`,
        })),
        questions: [],
    } as unknown as AssemblyRecordResponseDto;
}

const check = (r: AssemblyRecordResponseDto, code: string) =>
    buildPublishChecks(r).find((c) => c.code === code)!;

describe("buildPublishChecks", () => {
    it("blocks on a present unit with no answers", () => {
        // The gate the server enforces too: the votes-cast denominator only
        // means "of those present" when every present unit has a ballot.
        expect(
            check(record({ unitsAwaitingEntry: 5 }), "ANSWERS_COMPLETE"),
        ).toMatchObject({ ok: false, blocking: true });
    });

    it("does not block on an inquorate assembly", () => {
        // Recording that nothing could be adopted is a valid published record.
        expect(check(record({ quorate: false }), "QUORATE")).toMatchObject({
            ok: false,
            blocking: false,
        });
    });

    it("does not block on units the board never reached", () => {
        // Leaving a unit unset is the same as absent for the result; only a
        // present unit without answers distorts the denominator.
        expect(
            check(
                record({
                    presentUnitCount: 14,
                    absentUnitCount: 4,
                    ineligibleUnitCount: 2,
                    unitCount: 24,
                }),
                "ATTENDANCE_COMPLETE",
            ),
        ).toMatchObject({ ok: false, blocking: false });
    });

    it("blocks when nothing was recorded at all", () => {
        // Every other check passes vacuously on an empty record —
        // `unitsAwaitingEntry` is 0 because no unit is present — and
        // publishing cannot be undone. The server throws here; without this
        // the button would offer the board a guaranteed error.
        expect(
            check(
                record({ presentUnitCount: 0, absentUnitCount: 0 }),
                "ATTENDANCE_COMPLETE",
            ),
        ).toMatchObject({ ok: false, blocking: true });
    });

    it("warns about a missing meeting date without blocking on it", () => {
        // The date decides whose ownership counts, so its absence is worth
        // saying — but a vote carrying any ballot can no longer be edited, so
        // a gate here would be one the board cannot open.
        expect(
            check(record({ meetingDate: null }), "MEETING_DATE"),
        ).toMatchObject({ ok: false, blocking: false });
    });

    it("passes everything for a complete quorate record", () => {
        const checks = buildPublishChecks(record({ unitCount: 20 }));

        expect(checks.every((c) => c.ok)).toBe(true);
        expect(checks.some((c) => c.blocking && !c.ok)).toBe(false);
    });
});
