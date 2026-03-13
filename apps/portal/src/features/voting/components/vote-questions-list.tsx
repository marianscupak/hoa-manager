import { useTranslation } from "react-i18next";

import { type VoteDetailResponseDto } from "@/api/generated/model";

interface VoteQuestionsListProps {
    questions: VoteDetailResponseDto["questions"];
}

function formatMajorityRule(question: VoteDetailResponseDto["questions"][0]) {
    const ruleset = question.effectiveRuleset;
    if (!ruleset) return null;

    if (ruleset.majorityRuleType === "SIMPLE_MAJORITY") {
        return ">50%";
    }
    if (
        ruleset.majorityRuleType === "QUALIFIED_MAJORITY" &&
        ruleset.majorityThreshold
    ) {
        return `≥${ruleset.majorityThreshold}%`;
    }
    return ">50%";
}

export function VoteQuestionsList({ questions }: VoteQuestionsListProps) {
    const { t } = useTranslation(["voting"]);

    if (!questions || questions.length === 0) return null;

    return (
        <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold">
                {t("voting:detail.questions.title")}
            </h2>
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-3">
                    <span className="text-sm font-semibold text-slate-700">
                        {t("voting:detail.questions.preview")}
                    </span>
                </div>

                <div className="divide-y divide-slate-100">
                    {questions.map((question, index) => (
                        <div key={question.id} className="flex gap-4 p-6">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                                {index + 1}
                            </div>
                            <div className="flex flex-col gap-1 pt-1">
                                <h3 className="font-semibold text-slate-900">
                                    {question.title}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {t(
                                        "voting:detail.questions.majorityPrefix",
                                    )}{" "}
                                    {formatMajorityRule(question)}{" "}
                                    {t(
                                        "voting:detail.questions.majoritySuffix",
                                    )}
                                    {question.rulesetOverride && (
                                        <span className="text-primary ml-2 text-xs font-medium">
                                            {t(
                                                "voting:detail.questions.customRules",
                                            )}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
