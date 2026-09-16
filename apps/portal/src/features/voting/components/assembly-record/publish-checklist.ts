import type { AssemblyRecordResponseDto } from "@/api/generated/model";

export type PublishCheckCode =
    | "ATTENDANCE_COMPLETE"
    | "ANSWERS_COMPLETE"
    | "QUORATE"
    | "MEETING_DATE";

export interface PublishCheck {
    code: PublishCheckCode;
    ok: boolean;
    /** A failed blocking check disables the publish button. */
    blocking: boolean;
}

/**
 * What the board is asked to look at before publishing.
 *
 * Only two of these stop the publish. An assembly that fell short of quorum is
 * a perfectly valid record — publishing it is how the association documents
 * that nothing was adopted — and a unit the board never reached counts as
 * absent, which changes no denominator. What does have to hold is that every
 * unit recorded as present has a ballot, because that is what makes "votes
 * cast" mean "the votes that were in the room"; the server enforces the same
 * rule, and this list is there so the board finds out before it clicks rather
 * than after.
 */
export function buildPublishChecks(
    record: AssemblyRecordResponseDto,
): PublishCheck[] {
    const totals = record.totals;
    const recorded = totals.presentUnitCount + totals.absentUnitCount;
    const accountedFor = recorded + totals.ineligibleUnitCount;

    return [
        {
            code: "ATTENDANCE_COMPLETE",
            ok: accountedFor >= record.units.length,
            // Nothing recorded at all is not an assembly where nobody came —
            // that one has every unit marked absent. It is a record the board
            // never started, and every other check here would pass on it
            // vacuously: no present units means no missing ballots. The server
            // rejects it for the same reason, and publishing cannot be undone.
            blocking: recorded === 0,
        },
        {
            code: "ANSWERS_COMPLETE",
            ok: totals.unitsAwaitingEntry === 0,
            blocking: true,
        },
        {
            code: "QUORATE",
            ok: totals.quorate,
            blocking: false,
        },
        {
            code: "MEETING_DATE",
            ok: record.meetingDate !== null,
            // A warning, not a gate, even though the date matters: it is the
            // as-of point for resolving who owned what, so publishing without
            // one resolves the electorate as of today. Blocking would trap the
            // board — `assertEditable` freezes a vote as soon as it has a
            // ballot, so by the time anyone reaches this screen the date can
            // no longer be set. A warning they can act on beats a gate they
            // cannot open.
            blocking: false,
        },
    ];
}
