import { AlertTriangle, FileText, Home } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card, Checkbox } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import type {
    VoteParticipationUnitDto,
    VoteQuestionResponseDto,
} from "@/api/generated/model";

import type { BallotAttachment } from "../../hooks/use-ballot-attachment";
import { getOptionLabel } from "../../utils/option-label";
import { OptionIcon } from "../shared/question-options";

export interface ReviewStepProps {
    unit: VoteParticipationUnitDto;
    signerName: string;
    attachment: BallotAttachment;
    questions: VoteQuestionResponseDto[];
    answers: Record<string, string>;
    confirmed: boolean;
    onConfirmedChange: (value: boolean) => void;
}

export function ReviewStep({
    unit,
    signerName,
    attachment,
    questions,
    answers,
    confirmed,
    onConfirmedChange,
}: ReviewStepProps) {
    const { t } = useTranslation("voting");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-foreground text-2xl font-extrabold tracking-tight">
                    {t("paperBallot.review.title")}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {t("paperBallot.review.subtitle")}
                </p>
            </div>

            <Card className="p-5">
                <div className="flex items-center gap-3">
                    <div className="bg-primary-tint flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                        <Home className="text-primary-tint-foreground h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">
                            {unit.unitNo}
                            <span className="text-muted-foreground ml-2 font-normal">
                                {unit.share}
                            </span>
                        </p>
                        <p className="text-muted-foreground text-xs">
                            {t("paperBallot.review.signedBy", {
                                signer: signerName,
                            })}
                        </p>
                    </div>
                    <span className="bg-muted text-secondary-foreground flex max-w-[45%] shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="truncate">{attachment.fileName}</span>
                    </span>
                </div>

                <div className="mt-4 space-y-2 border-t pt-4">
                    {questions.map((question, index) => {
                        const option = question.options.find(
                            (o) => o.id === answers[question.id],
                        );
                        return (
                            <div
                                key={question.id}
                                className="border-hairline bg-muted/50 rounded-panel flex items-center justify-between gap-3 border px-4 py-3"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="bg-muted text-secondary-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="text-secondary-foreground truncate text-sm">
                                        {question.title}
                                    </span>
                                </div>
                                {option && (
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="text-secondary-foreground text-sm font-bold">
                                            {getOptionLabel(
                                                option.optionKey,
                                                option.label,
                                                t,
                                            )}
                                        </span>
                                        <OptionIcon
                                            optionKey={option.optionKey}
                                            className="h-4 w-4"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Card className="bg-warning-muted border-warning-tint-border flex items-start gap-3 p-4">
                <AlertTriangle className="text-warning-tint-foreground mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-warning-deep text-sm">
                    {t("paperBallot.review.warning")}
                </p>
            </Card>

            <button
                type="button"
                onClick={() => onConfirmedChange(!confirmed)}
                className={cn(
                    "rounded-panel flex w-full cursor-pointer items-start gap-3 border-2 p-4 text-left transition-colors",
                    confirmed
                        ? "border-primary bg-primary-tint/40"
                        : "border-border bg-card hover:bg-muted/50",
                )}
            >
                <Checkbox
                    checked={confirmed}
                    className="mt-0.5 shrink-0"
                    tabIndex={-1}
                />
                <span className="text-secondary-foreground text-sm">
                    {t("paperBallot.review.confirm", { unit: unit.unitNo })}
                </span>
            </button>
        </div>
    );
}
