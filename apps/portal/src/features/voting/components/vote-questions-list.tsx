import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    StatusChip,
} from "@hoa-mngr/ui";

import {
    type VoteDetailResponseDto,
    VoteOptionResponseDtoOptionKey,
} from "@/api/generated/model";

import { buildRuleSentence } from "../utils/rule-sentence";

interface VoteQuestionsListProps {
    questions: VoteDetailResponseDto["questions"];
}

const SYSTEM_OPTION_KEYS: readonly string[] = [
    VoteOptionResponseDtoOptionKey.YES,
    VoteOptionResponseDtoOptionKey.NO,
    VoteOptionResponseDtoOptionKey.ABSTAIN,
];

function optionLabel(
    option: VoteDetailResponseDto["questions"][number]["options"][number],
    t: TFunction<"voting">,
): string {
    if (SYSTEM_OPTION_KEYS.includes(option.optionKey)) {
        return t(
            // Safe: guarded by SYSTEM_OPTION_KEYS above.
            `create.optionLabels.${option.optionKey as "YES" | "NO" | "ABSTAIN"}`,
        );
    }
    return option.label;
}

export function VoteQuestionsList({ questions }: VoteQuestionsListProps) {
    const { t } = useTranslation("voting");

    if (!questions || questions.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-muted-foreground text-detail font-semibold tracking-wide uppercase">
                    {t("detail.questions.title")}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col pt-0">
                {questions.map((question, index) => {
                    const ruleSentence = question.effectiveRuleset
                        ? buildRuleSentence(question.effectiveRuleset, t)
                        : null;
                    const optionsSummary = question.options
                        .map((option) => optionLabel(option, t))
                        .join(" / ");

                    return (
                        <div
                            key={question.id}
                            className="border-hairline flex gap-3.5 border-b py-3.5 first:pt-0 last:border-b-0 last:pb-0"
                        >
                            <div className="bg-primary-tint text-primary-tint-foreground font-display text-detail flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg font-extrabold">
                                {index + 1}
                            </div>
                            <div className="min-w-0 pt-px">
                                <h3 className="text-md leading-[22px] font-semibold">
                                    {question.title}
                                </h3>
                                <div className="text-muted-foreground text-detail mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 leading-[19px]">
                                    {ruleSentence && (
                                        <span>{ruleSentence}</span>
                                    )}
                                    {ruleSentence && optionsSummary && (
                                        <span aria-hidden="true">·</span>
                                    )}
                                    {optionsSummary && (
                                        <span>{optionsSummary}</span>
                                    )}
                                    {question.rulesetOverride && (
                                        <StatusChip
                                            variant="primary"
                                            dot={false}
                                        >
                                            {t("rules.customRule")}
                                        </StatusChip>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
