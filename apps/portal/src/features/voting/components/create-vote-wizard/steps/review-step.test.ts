import { describe, expect, it } from "vitest";

import type { VoteDetailResponseDto } from "@/api/generated/model";

import { buildReviewChecks, type ReviewCheck } from "./review-step";

const DAY_MS = 24 * 60 * 60 * 1000;

function buildVote(
    overrides: Partial<VoteDetailResponseDto>,
): VoteDetailResponseDto {
    return {
        id: "vote-1",
        title: "Test vote",
        description: null,
        scheduledFrom: null,
        scheduledTo: null,
        status: "DRAFT",
        mode: "PER_ROLLAM",
        ruleset: null,
        questions: [],
        ...overrides,
    } as VoteDetailResponseDto;
}

function findCheck(checks: ReviewCheck[], code: string): ReviewCheck {
    const check = checks.find((c) => c.code === code);
    if (!check) throw new Error(`Missing check ${code}`);
    return check;
}

const completeVote = buildVote({
    scheduledFrom: new Date(Date.now() + 2 * DAY_MS).toISOString(),
    scheduledTo: new Date(Date.now() + 22 * DAY_MS).toISOString(),
    ruleset: {} as VoteDetailResponseDto["ruleset"],
    questions: [
        {
            id: "q1",
            title: "Do you approve?",
            description: null,
            type: "YES_NO",
            sortOrder: 1,
            options: [],
        } as unknown as VoteDetailResponseDto["questions"][number],
    ],
});

describe("buildReviewChecks", () => {
    it("marks every check ok for a complete draft with a comfortable voting period", () => {
        const checks = buildReviewChecks(completeVote);

        expect(checks.every((c) => c.ok)).toBe(true);
    });

    it("fails MISSING_DATES, IN_PAST and INVALID_RANGE when no dates are set (vacuously ok for the null-guarded ones)", () => {
        const vote = buildVote({
            scheduledFrom: null,
            scheduledTo: null,
            ruleset: completeVote.ruleset,
            questions: completeVote.questions,
        });
        const checks = buildReviewChecks(vote);

        expect(findCheck(checks, "VOTE_SCHEDULE_MISSING_DATES").ok).toBe(false);
        // Null-guarded: no `from`/`to` means these checks can't be violated.
        expect(findCheck(checks, "VOTE_SCHEDULE_IN_PAST").ok).toBe(true);
        expect(findCheck(checks, "VOTE_SCHEDULE_INVALID_RANGE").ok).toBe(true);
        expect(findCheck(checks, "SHORT_VOTING_PERIOD").ok).toBe(true);
    });

    it("fails INVALID_RANGE when the opening date is after the closing date (both in the future)", () => {
        const vote = buildVote({
            scheduledFrom: new Date(Date.now() + 22 * DAY_MS).toISOString(),
            scheduledTo: new Date(Date.now() + 2 * DAY_MS).toISOString(),
            ruleset: completeVote.ruleset,
            questions: completeVote.questions,
        });
        const checks = buildReviewChecks(vote);

        expect(findCheck(checks, "VOTE_SCHEDULE_INVALID_RANGE").ok).toBe(false);
        expect(findCheck(checks, "VOTE_SCHEDULE_MISSING_DATES").ok).toBe(true);
        expect(findCheck(checks, "VOTE_SCHEDULE_IN_PAST").ok).toBe(true);
    });

    it("fails VOTE_SCHEDULE_IN_PAST when the opening date has already passed", () => {
        const vote = buildVote({
            scheduledFrom: new Date(Date.now() - 2 * DAY_MS).toISOString(),
            scheduledTo: new Date(Date.now() + 22 * DAY_MS).toISOString(),
            ruleset: completeVote.ruleset,
            questions: completeVote.questions,
        });
        const checks = buildReviewChecks(vote);

        expect(findCheck(checks, "VOTE_SCHEDULE_IN_PAST").ok).toBe(false);
    });

    it("fails VOTE_MISSING_QUESTIONS when there are no questions (and vacuously passes MISSING_OPTIONS)", () => {
        const vote = buildVote({
            scheduledFrom: completeVote.scheduledFrom,
            scheduledTo: completeVote.scheduledTo,
            ruleset: completeVote.ruleset,
            questions: [],
        });
        const checks = buildReviewChecks(vote);

        expect(findCheck(checks, "VOTE_MISSING_QUESTIONS").ok).toBe(false);
        expect(findCheck(checks, "VOTE_QUESTION_MISSING_OPTIONS").ok).toBe(
            true,
        );
    });

    it("fails VOTE_QUESTION_MISSING_OPTIONS for a SINGLE_CHOICE question with fewer than 2 options, but passes for YES_NO", () => {
        const vote = buildVote({
            scheduledFrom: completeVote.scheduledFrom,
            scheduledTo: completeVote.scheduledTo,
            ruleset: completeVote.ruleset,
            questions: [
                {
                    id: "q1",
                    title: "Yes/No question",
                    description: null,
                    type: "YES_NO",
                    sortOrder: 1,
                    options: [],
                } as unknown as VoteDetailResponseDto["questions"][number],
                {
                    id: "q2",
                    title: "Pick one",
                    description: null,
                    type: "SINGLE_CHOICE",
                    sortOrder: 2,
                    options: [
                        {
                            id: "o1",
                            label: "Option A",
                            sortOrder: 1,
                            optionKey: "CUSTOM",
                        },
                    ],
                } as unknown as VoteDetailResponseDto["questions"][number],
            ],
        });
        const checks = buildReviewChecks(vote);

        expect(findCheck(checks, "VOTE_QUESTION_MISSING_OPTIONS").ok).toBe(
            false,
        );
    });

    it("fails VOTE_RULESET_REQUIRED when no ruleset is configured", () => {
        const vote = buildVote({
            scheduledFrom: completeVote.scheduledFrom,
            scheduledTo: completeVote.scheduledTo,
            ruleset: null,
            questions: completeVote.questions,
        });
        const checks = buildReviewChecks(vote);

        expect(findCheck(checks, "VOTE_RULESET_REQUIRED").ok).toBe(false);
    });

    it("warns SHORT_VOTING_PERIOD when the voting period is under 15 days", () => {
        const vote = buildVote({
            scheduledFrom: new Date(Date.now() + 2 * DAY_MS).toISOString(),
            scheduledTo: new Date(Date.now() + 12 * DAY_MS).toISOString(),
            ruleset: completeVote.ruleset,
            questions: completeVote.questions,
        });
        const checks = buildReviewChecks(vote);
        const shortPeriod = findCheck(checks, "SHORT_VOTING_PERIOD");

        expect(shortPeriod.ok).toBe(false);
        expect(shortPeriod.severity).toBe("warning");
    });

    it("assigns the expected step and severity to each check", () => {
        const checks = buildReviewChecks(completeVote);

        expect(findCheck(checks, "VOTE_SCHEDULE_MISSING_DATES").step).toBe(
            "details",
        );
        expect(findCheck(checks, "VOTE_RULESET_REQUIRED").step).toBe("rules");
        expect(findCheck(checks, "VOTE_MISSING_QUESTIONS").step).toBe(
            "questions",
        );
        expect(findCheck(checks, "VOTE_QUESTION_MISSING_OPTIONS").step).toBe(
            "questions",
        );
        expect(findCheck(checks, "SHORT_VOTING_PERIOD").severity).toBe(
            "warning",
        );
        expect(findCheck(checks, "VOTE_RULESET_REQUIRED").severity).toBe(
            "error",
        );
    });
});
