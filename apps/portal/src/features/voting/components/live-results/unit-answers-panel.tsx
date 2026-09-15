import { useTranslation } from "react-i18next";

import { type VoteDetailResponseDto } from "@/api/generated/model";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type { LiveResultsRow } from "../../utils/live-results-filter";

const ANSWER_CLASS: Record<string, string> = {
    YES: "text-success-tint-foreground",
    NO: "text-destructive-muted-foreground",
    ABSTAIN: "text-muted-foreground",
    CUSTOM: "text-foreground",
};

interface UnitAnswersPanelProps {
    unit: LiveResultsRow;
    questions: VoteDetailResponseDto["questions"];
}

export function UnitAnswersPanel({ unit, questions }: UnitAnswersPanelProps) {
    const { t } = useTranslation("voting");

    // Driven by the vote's questions rather than the answers array, so a
    // ballot that skipped a question still shows that question's line.
    const answerByQuestionId = new Map(
        (unit.answers ?? []).map((answer) => [answer.questionId, answer]),
    );

    return (
        <dl className="flex flex-col gap-1.5">
            {questions.map((question, index) => {
                const answer = answerByQuestionId.get(question.id);
                return (
                    <div
                        key={question.id}
                        className="flex items-baseline justify-between gap-4"
                    >
                        <dt className="text-secondary-foreground text-detail min-w-0 truncate">
                            {index + 1}. {question.title}
                        </dt>
                        <dd
                            className={cn(
                                "text-detail shrink-0 font-semibold",
                                answer
                                    ? ANSWER_CLASS[answer.optionKey] ??
                                          "text-foreground"
                                    : "text-faint",
                            )}
                        >
                            {answer?.optionLabel ??
                                t("liveResults.answers.none")}
                        </dd>
                    </div>
                );
            })}
        </dl>
    );
}
