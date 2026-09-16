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

    it("fails MISSING_DATES when no dates are set, vacuously passing the null-guarded one", () => {
        const vote = buildVote({
            scheduledFrom: null,
            scheduledTo: null,
            ruleset: completeVote.ruleset,
            questions: completeVote.questions,
        });
        const checks = buildReviewChecks(vote);

        expect(findCheck(checks, "VOTE_SCHEDULE_MISSING_DATES").ok).toBe(false);
        // Null-guarded: no `from` means this check can't be violated.
        expect(findCheck(checks, "VOTE_SCHEDULE_IN_PAST").ok).toBe(true);
    });

    it("carries only the four checks no wizard step can catch on its own", () => {
        // Date ordering, the per-rollam floor, question wording and answer
        // options are all blocked by the form on their own step now, so
        // repeating them here was pure noise on an otherwise green list.
        expect(buildReviewChecks(completeVote).map((c) => c.code)).toEqual([
            "VOTE_SCHEDULE_MISSING_DATES",
            "VOTE_SCHEDULE_IN_PAST",
            "VOTE_RULESET_REQUIRED",
            "VOTE_MISSING_QUESTIONS",
        ]);
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

    it("fails VOTE_MISSING_QUESTIONS when there are no questions", () => {
        const vote = buildVote({
            scheduledFrom: completeVote.scheduledFrom,
            scheduledTo: completeVote.scheduledTo,
            ruleset: completeVote.ruleset,
            questions: [],
        });
        const checks = buildReviewChecks(vote);

        expect(findCheck(checks, "VOTE_MISSING_QUESTIONS").ok).toBe(false);
    });

    it("assigns the expected step and severity to each check", () => {
        const checks = buildReviewChecks(completeVote);

        expect(findCheck(checks, "VOTE_SCHEDULE_MISSING_DATES").step).toBe(
            "details",
        );
        expect(findCheck(checks, "VOTE_SCHEDULE_IN_PAST").step).toBe("details");
        expect(findCheck(checks, "VOTE_RULESET_REQUIRED").step).toBe("rules");
        expect(findCheck(checks, "VOTE_MISSING_QUESTIONS").step).toBe(
            "questions",
        );
        expect(checks.every((c) => c.severity === "error")).toBe(true);
    });

    it("omits the in-past check for an assembly record", () => {
        // The meeting already happened, so its date is supposed to be in the
        // past; keeping the check would make the wizard impossible to finish.
        const vote = buildVote({
            mode: "ASSEMBLY_RECORD",
            scheduledFrom: new Date(Date.now() - 4 * DAY_MS).toISOString(),
            scheduledTo: null,
            ruleset: completeVote.ruleset,
            questions: completeVote.questions,
        });

        expect(buildReviewChecks(vote).map((c) => c.code)).toEqual([
            "VOTE_SCHEDULE_MISSING_DATES",
            "VOTE_RULESET_REQUIRED",
            "VOTE_MISSING_QUESTIONS",
        ]);
    });

    it("needs only the meeting date for an assembly record", () => {
        // `scheduledTo` is unused for this mode, so requiring both dates would
        // block a record that is in fact complete.
        const vote = buildVote({
            mode: "ASSEMBLY_RECORD",
            scheduledFrom: new Date(Date.now() - 4 * DAY_MS).toISOString(),
            scheduledTo: null,
            ruleset: completeVote.ruleset,
            questions: completeVote.questions,
        });

        expect(buildReviewChecks(vote).every((c) => c.ok)).toBe(true);
    });

    it("fails the meeting-date check when an assembly record has no date", () => {
        const vote = buildVote({
            mode: "ASSEMBLY_RECORD",
            scheduledFrom: null,
            scheduledTo: null,
            ruleset: completeVote.ruleset,
            questions: completeVote.questions,
        });

        expect(
            findCheck(buildReviewChecks(vote), "VOTE_SCHEDULE_MISSING_DATES").ok,
        ).toBe(false);
    });

    it("still requires both dates and a future start for per rollam", () => {
        const codes = buildReviewChecks(completeVote).map((c) => c.code);

        expect(codes).toContain("VOTE_SCHEDULE_IN_PAST");
        expect(codes).toContain("VOTE_SCHEDULE_MISSING_DATES");
    });
});
