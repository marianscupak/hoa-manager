import { useTranslation } from "react-i18next";

import {
    type VoteDetailResponseDto,
    type VoteTallyResponseDto,
} from "@/api/generated/model";
import { Card, StatusChip, type StatusChipVariant } from "@hoa-mngr/ui";

import { formatTallyOption } from "../../utils/tally-display";

const OPTION_VARIANT: Record<string, StatusChipVariant> = {
    YES: "success",
    NO: "destructive",
    ABSTAIN: "neutral",
    CUSTOM: "neutral",
};

interface RunningTallyCardProps {
    tally: VoteTallyResponseDto;
    questions: VoteDetailResponseDto["questions"];
    weightBasis: "UNIT_SHARE" | "ONE_UNIT_ONE_VOTE";
}

export function RunningTallyCard({
    tally,
    questions,
    weightBasis,
}: RunningTallyCardProps) {
    const { t } = useTranslation("voting");

    // The tally carries option ids and figures only, so both the reading
    // order and every label come from the vote detail.
    const tallyByQuestionId = new Map(
        tally.questions.map((question) => [question.questionId, question]),
    );

    return (
        <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-title font-extrabold tracking-tight">
                    {t("liveResults.tally.title")}
                </h2>
                <span className="text-faint text-2xs font-semibold">
                    {t("liveResults.tally.note")}
                </span>
            </div>

            <div className="flex flex-col gap-4">
                {questions.map((question, index) => {
                    const tallyQuestion = tallyByQuestionId.get(question.id);
                    const entries = tallyQuestion
                        ? tallyQuestion.options.map((option) => ({
                              option,
                              meta: question.options.find(
                                  (o) => o.id === option.optionId,
                              ),
                              display: formatTallyOption(
                                  option,
                                  tallyQuestion.majorityDenominator,
                                  weightBasis,
                              ),
                          }))
                        : [];
                    const hasFigures = entries.some(
                        (entry) => entry.display.primary !== null,
                    );

                    return (
                        <div
                            key={question.id}
                            className="border-hairline flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0"
                        >
                            <p className="text-sm font-semibold">
                                {index + 1}. {question.title}
                            </p>
                            {hasFigures ? (
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                    {entries.map(
                                        ({ option, meta, display }) => (
                                            <div
                                                key={option.optionId}
                                                className="flex items-center gap-1.5"
                                            >
                                                <StatusChip
                                                    variant={
                                                        OPTION_VARIANT[
                                                            meta?.optionKey ??
                                                                ""
                                                        ] ?? "neutral"
                                                    }
                                                >
                                                    {/* An option the vote
                                                        detail does not list
                                                        degrades to a dash —
                                                        never a raw id. */}
                                                    {meta?.label ?? "—"}
                                                    <span className="font-bold tabular-nums">
                                                        {display.primary}
                                                    </span>
                                                </StatusChip>
                                                {display.secondary !== null && (
                                                    <span className="text-faint text-2xs tabular-nums">
                                                        {t(
                                                            "liveResults.tally.units",
                                                            {
                                                                count: display.secondary,
                                                            },
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-detail">
                                    {t("liveResults.tally.empty")}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
