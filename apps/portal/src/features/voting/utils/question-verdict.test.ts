import { describe, expect, it } from "vitest";

import type {
    VoteOptionResponseDto,
    VoteQuestionResultDto,
} from "@/api/generated/model";

import { mapQuestionVerdict } from "./question-verdict";

const options: VoteOptionResponseDto[] = [
    { id: "o-yes", label: "For", sortOrder: 1, optionKey: "YES" },
    { id: "o-no", label: "Against", sortOrder: 2, optionKey: "NO" },
];

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

describe("mapQuestionVerdict", () => {
    it("returns notDecided when quorum was not met, regardless of majority", () => {
        const outcome = mapQuestionVerdict({
            quorumMet: false,
            questionType: "YES_NO",
            result: buildResult({ majorityMet: true, winningOptionId: "o-yes" }),
            options,
        });

        expect(outcome.verdict).toBe("notDecided");
    });

    it("returns approved for a yes/no question when YES wins the majority", () => {
        const outcome = mapQuestionVerdict({
            quorumMet: true,
            questionType: "YES_NO",
            result: buildResult({ majorityMet: true, winningOptionId: "o-yes" }),
            options,
        });

        expect(outcome.verdict).toBe("approved");
        expect(outcome.winningOption).toEqual(options[0]);
    });

    it("returns rejected for a yes/no question when NO wins the majority", () => {
        const outcome = mapQuestionVerdict({
            quorumMet: true,
            questionType: "YES_NO",
            result: buildResult({ majorityMet: true, winningOptionId: "o-no" }),
            options,
        });

        expect(outcome.verdict).toBe("rejected");
        expect(outcome.winningOption).toEqual(options[1]);
    });

    it("returns rejected for a yes/no question when no option reached the majority", () => {
        const outcome = mapQuestionVerdict({
            quorumMet: true,
            questionType: "YES_NO",
            result: buildResult({ majorityMet: false, winningOptionId: null }),
            options,
        });

        expect(outcome.verdict).toBe("rejected");
        expect(outcome.winningOption).toBeNull();
    });

    it("returns winner for a single-choice question with a majority winner", () => {
        const outcome = mapQuestionVerdict({
            quorumMet: true,
            questionType: "SINGLE_CHOICE",
            result: buildResult({ majorityMet: true, winningOptionId: "o-yes" }),
            options,
        });

        expect(outcome.verdict).toBe("winner");
    });

    it("returns notDecided for a single-choice question without a majority winner (tie or below threshold)", () => {
        const outcome = mapQuestionVerdict({
            quorumMet: true,
            questionType: "SINGLE_CHOICE",
            result: buildResult({ majorityMet: false, winningOptionId: null }),
            options,
        });

        expect(outcome.verdict).toBe("notDecided");
    });
});
