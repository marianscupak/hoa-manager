import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, Card, formatPercentValue } from "@hoa-mngr/ui";

import type { VoteQuestionResponseDto } from "@/api/generated/model";

import { QuestionOptionGrid } from "../shared/question-options";

export interface AnswersStepProps {
    question: VoteQuestionResponseDto;
    questionIndex: number;
    totalQuestions: number;
    unitNo: string;
    signerName: string;
    selectedOptionId: string | undefined;
    onSelect: (optionId: string) => void;
    onChangeBallot: () => void;
}

export function AnswersStep({
    question,
    questionIndex,
    totalQuestions,
    unitNo,
    signerName,
    selectedOptionId,
    onSelect,
    onChangeBallot,
}: AnswersStepProps) {
    const { t } = useTranslation("voting");
    const answeredPct = Math.round((questionIndex / totalQuestions) * 100);

    return (
        <div className="space-y-6">
            <Card className="bg-primary-tint/50 border-primary-tint-border flex items-center gap-3 p-4">
                <FileText className="text-primary-tint-foreground h-4 w-4 shrink-0" />
                <p className="text-secondary-foreground min-w-0 flex-1 text-sm">
                    {t("paperBallot.answers.context", {
                        unit: unitNo,
                        signer: signerName,
                    })}
                </p>
                <Button variant="ghost" size="sm" onClick={onChangeBallot}>
                    {t("paperBallot.answers.change")}
                </Button>
            </Card>

            <div>
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-secondary-foreground text-sm font-medium">
                        {t("paperBallot.answers.progress", {
                            current: questionIndex + 1,
                            total: totalQuestions,
                        })}
                    </span>
                    <span className="text-primary-tint-foreground text-sm font-bold">
                        {t("paperBallot.answers.done", {
                            percent: formatPercentValue(answeredPct, 0),
                        })}
                    </span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                        className="bg-primary h-full rounded-full transition-all duration-300 motion-reduce:transition-none"
                        style={{
                            width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
                        }}
                    />
                </div>
            </div>

            <Card className="p-6">
                <h2 className="font-display text-title font-extrabold tracking-tight">
                    {question.title}
                </h2>
                {question.description && (
                    <p className="text-muted-foreground mt-2 text-sm">
                        {question.description}
                    </p>
                )}
            </Card>

            <QuestionOptionGrid
                options={question.options}
                selectedOptionId={selectedOptionId}
                onSelect={onSelect}
            />

            <p className="text-muted-foreground text-center text-xs">
                {t("paperBallot.answers.caption")}
            </p>
        </div>
    );
}
