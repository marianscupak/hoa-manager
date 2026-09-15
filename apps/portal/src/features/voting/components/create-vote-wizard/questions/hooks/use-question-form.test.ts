import { describe, expect, it } from "vitest";

import { questionSchema } from "./use-question-form";

function errorsFor(
    type: "YES_NO" | "SINGLE_CHOICE",
    options: { label: string; sortOrder: number }[],
): string[] {
    const result = questionSchema.safeParse({
        title: "Do you approve?",
        description: "",
        type,
        useCustomRuleset: false,
        majorityRuleType: "SIMPLE_MAJORITY",
        majorityDenominatorBasis: "ALL_VOTES",
        majorityThreshold: { num: 1, den: 2 },
        majorityComparator: "STRICT_GREATER",
        options,
    });
    return result.success ? [] : result.error.issues.map((i) => i.message);
}

const TWO = [
    { label: "Roof", sortOrder: 1 },
    { label: "Facade", sortOrder: 2 },
];

describe("questionSchema", () => {
    it("rejects a multiple-choice question with only one option", () => {
        // The checklist no longer carries this, and `options-list.tsx` lets
        // the chair delete down to zero, so the schema has to hold the line.
        expect(errorsFor("SINGLE_CHOICE", [TWO[0]])).toContain(
            "voting:create.steps.questions.options.errors.atLeastTwo",
        );
    });

    it("rejects a multiple-choice question with no options at all", () => {
        expect(errorsFor("SINGLE_CHOICE", [])).toContain(
            "voting:create.steps.questions.options.errors.atLeastTwo",
        );
    });

    it("accepts a multiple-choice question with two options", () => {
        expect(errorsFor("SINGLE_CHOICE", TWO)).toEqual([]);
    });

    it("accepts a yes/no question with no options, since they are generated", () => {
        expect(errorsFor("YES_NO", [])).toEqual([]);
    });

    it("still rejects a blank option label with a translated message", () => {
        expect(
            errorsFor("SINGLE_CHOICE", [{ label: "", sortOrder: 1 }, TWO[1]]),
        ).toContain("voting:create.steps.questions.options.errors.required");
    });
});
