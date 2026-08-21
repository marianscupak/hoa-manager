import { describe, expect, it } from "vitest";

import type {
    VoteOptionResponseDto,
    VoteQuestionResultDto,
} from "@/api/generated/model";

import { mapQuestionVerdict, type QuestionVerdict } from "./question-verdict";

/**
 * Agreement test for the §3 verdict table.
 *
 * The design spec (`docs/superpowers/specs/2026-08-19-soft-clay-redesign-design.md`,
 * §3 "Verdict mapping") defines one table that both sides of the wire must
 * implement identically: the server derives the persisted/exported outcome in
 * `deriveQuestionOutcome`, the client derives the displayed chip in
 * `mapQuestionVerdict`. Every row here therefore names the server outcome it
 * must agree with.
 *
 * THIS TABLE AND `apps/api/src/modules/voting/domain/vote/question-outcome.spec.ts`
 * MUST STAY IN LOCKSTEP. A row added, removed or changed in one file has to be
 * mirrored in the other — otherwise the results page would show a verdict that
 * contradicts the outcome chips on the votes list and the audit export, which
 * are fed by the server's mapping.
 */

const YES: VoteOptionResponseDto = {
    id: "o-yes",
    label: "For",
    sortOrder: 1,
    optionKey: "YES",
};
const NO: VoteOptionResponseDto = {
    id: "o-no",
    label: "Against",
    sortOrder: 2,
    optionKey: "NO",
};
const CUSTOM: VoteOptionResponseDto = {
    id: "o-custom",
    label: "Option B",
    sortOrder: 3,
    optionKey: "CUSTOM",
};

const options = [YES, NO, CUSTOM];

function buildResult(
    overrides: Partial<VoteQuestionResultDto>,
): VoteQuestionResultDto {
    return {
        questionId: "q1",
        majorityMet: false,
        winningOptionId: null,
        majorityThresholdValue: null,
        majorityDenominatorValue: 1,
        optionResults: [],
        ...overrides,
    };
}

interface VerdictTableRow {
    /** The spec §3 row this case comes from. */
    specRow: string;
    /** The server outcome `deriveQuestionOutcome` returns for the same inputs. */
    serverOutcome: "NOT_DECIDED" | "APPROVED" | "REJECTED" | "WINNER";
    quorumMet: boolean;
    questionType: "YES_NO" | "SINGLE_CHOICE";
    majorityMet: boolean;
    winningOptionId: string | null;
    expected: QuestionVerdict;
    expectedWinningOptionId: string | null;
}

const table: VerdictTableRow[] = [
    {
        specRow: "!results.quorumMet → Not decided (yes/no, majority reached)",
        serverOutcome: "NOT_DECIDED",
        quorumMet: false,
        questionType: "YES_NO",
        majorityMet: true,
        winningOptionId: YES.id,
        expected: "notDecided",
        expectedWinningOptionId: YES.id,
    },
    {
        specRow:
            "!results.quorumMet → Not decided (single-choice, majority reached)",
        serverOutcome: "NOT_DECIDED",
        quorumMet: false,
        questionType: "SINGLE_CHOICE",
        majorityMet: true,
        winningOptionId: CUSTOM.id,
        expected: "notDecided",
        expectedWinningOptionId: CUSTOM.id,
    },
    {
        specRow:
            "quorum met, yes/no, majorityMet and the winner's optionKey is YES → Approved",
        serverOutcome: "APPROVED",
        quorumMet: true,
        questionType: "YES_NO",
        majorityMet: true,
        winningOptionId: YES.id,
        expected: "approved",
        expectedWinningOptionId: YES.id,
    },
    {
        specRow: "quorum met, yes/no, NO won the majority → Rejected",
        serverOutcome: "REJECTED",
        quorumMet: true,
        questionType: "YES_NO",
        majorityMet: true,
        winningOptionId: NO.id,
        expected: "rejected",
        expectedWinningOptionId: NO.id,
    },
    {
        specRow:
            "quorum met, yes/no, no option reached the majority → Rejected",
        serverOutcome: "REJECTED",
        quorumMet: true,
        questionType: "YES_NO",
        majorityMet: false,
        winningOptionId: null,
        expected: "rejected",
        expectedWinningOptionId: null,
    },
    {
        specRow: 'quorum met, single-choice, majorityMet → "«option» wins"',
        serverOutcome: "WINNER",
        quorumMet: true,
        questionType: "SINGLE_CHOICE",
        majorityMet: true,
        winningOptionId: CUSTOM.id,
        expected: "winner",
        expectedWinningOptionId: CUSTOM.id,
    },
    {
        specRow:
            "quorum met, single-choice, !majorityMet (tie or below threshold) → Not decided",
        serverOutcome: "NOT_DECIDED",
        quorumMet: true,
        questionType: "SINGLE_CHOICE",
        majorityMet: false,
        winningOptionId: null,
        expected: "notDecided",
        expectedWinningOptionId: null,
    },
];

describe("mapQuestionVerdict agrees with the spec §3 verdict table", () => {
    it.each(table)(
        "$specRow (server: $serverOutcome)",
        ({
            quorumMet,
            questionType,
            majorityMet,
            winningOptionId,
            expected,
            expectedWinningOptionId,
        }) => {
            const outcome = mapQuestionVerdict({
                quorumMet,
                questionType,
                result: buildResult({ majorityMet, winningOptionId }),
                options,
            });

            expect(outcome.verdict).toBe(expected);
            expect(outcome.winningOption?.id ?? null).toBe(
                expectedWinningOptionId,
            );
        },
    );

    it("covers every verdict the client can produce", () => {
        const covered = new Set(table.map((row) => row.expected));

        expect([...covered].sort()).toEqual([
            "approved",
            "notDecided",
            "rejected",
            "winner",
        ]);
    });
});
