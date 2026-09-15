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
        expect(
            findCheck(checks, "VOTE_WINDOW_TOO_SHORT_PER_ROLLAM").ok,
        ).toBe(true);
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

    it("fails QUESTION_MISSING_TITLE when a question was added but never named", () => {
        const vote = buildVote({
            scheduledFrom: completeVote.scheduledFrom,
            scheduledTo: completeVote.scheduledTo,
            ruleset: completeVote.ruleset,
            questions: [
                {
                    id: "q1",
                    title: "",
                    description: null,
                    type: "YES_NO",
                    sortOrder: 1,
                    options: [],
                } as unknown as VoteDetailResponseDto["questions"][number],
            ],
        });
        const checks = buildReviewChecks(vote);
        const titleCheck = findCheck(checks, "VOTE_QUESTION_MISSING_TITLE");

        expect(titleCheck.ok).toBe(false);
        expect(titleCheck.severity).toBe("error");
        expect(titleCheck.step).toBe("questions");
    });

    it("treats a whitespace-only question title as missing", () => {
        const vote = buildVote({
            scheduledFrom: completeVote.scheduledFrom,
            scheduledTo: completeVote.scheduledTo,
            ruleset: completeVote.ruleset,
            questions: [
                {
                    id: "q1",
                    title: "   ",
                    description: null,
                    type: "YES_NO",
                    sortOrder: 1,
                    options: [],
                } as unknown as VoteDetailResponseDto["questions"][number],
            ],
        });

        expect(
            findCheck(buildReviewChecks(vote), "VOTE_QUESTION_MISSING_TITLE").ok,
        ).toBe(false);
    });

    it("fails WINDOW_TOO_SHORT as an error when a per rollam vote runs under 15 days", () => {
        // The server rejects this outright (`vote.aggregate.ts`), so the
        // checklist must not present it as advice the chair can wave through.
        const vote = buildVote({
            mode: "PER_ROLLAM",
            scheduledFrom: new Date(Date.now() + 2 * DAY_MS).toISOString(),
            scheduledTo: new Date(Date.now() + 12 * DAY_MS).toISOString(),
            ruleset: completeVote.ruleset,
            questions: completeVote.questions,
        });
        const checks = buildReviewChecks(vote);
        const window = findCheck(checks, "VOTE_WINDOW_TOO_SHORT_PER_ROLLAM");

        expect(window.ok).toBe(false);
        expect(window.severity).toBe("error");
        expect(window.step).toBe("details");
    });

    it("omits the window check entirely for an assembly record", () => {
        // An assembly record captures when a meeting happened, not how long
        // owners had to respond, so the 15-day floor does not apply.
        const vote = buildVote({
            mode: "ASSEMBLY_RECORD",
            scheduledFrom: new Date(Date.now() + 2 * DAY_MS).toISOString(),
            scheduledTo: new Date(Date.now() + 3 * DAY_MS).toISOString(),
            ruleset: completeVote.ruleset,
            questions: completeVote.questions,
        });
        const checks = buildReviewChecks(vote);

        expect(
            checks.some((c) => c.code === "VOTE_WINDOW_TOO_SHORT_PER_ROLLAM"),
        ).toBe(false);
        expect(checks.every((c) => c.ok)).toBe(true);
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
        expect(
            findCheck(checks, "VOTE_WINDOW_TOO_SHORT_PER_ROLLAM").severity,
        ).toBe("error");
        expect(findCheck(checks, "VOTE_RULESET_REQUIRED").severity).toBe(
            "error",
        );
    });
});
