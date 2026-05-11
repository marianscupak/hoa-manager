import { TFunction } from "i18next";
import {
    Check,
    X,
    Minus,
    ArrowLeft,
    ArrowRight,
    Home,
    Loader2,
    ShieldCheck,
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router";

import { Button } from "@hoa-mngr/ui";
import { cn } from "@hoa-mngr/ui/lib/utils";

import {
    useVotesControllerGetVoteDetail,
    useVotesControllerGetVoterStatus,
} from "@/api/generated/votes/votes";

import { VoteSuccessModal } from "../components/cast-vote/vote-success-modal";
import {
    useSubmitBallot,
    type SubmitBallotBody,
} from "../hooks/use-submit-ballot";

// ── Types ───────────────────────────────────────────────────
interface BallotAnswers {
    [unitId: string]: {
        [questionId: string]: string; // optionId
    };
}

type CastVoteStep = "questions" | "review";

// ── Option Icon ────────────────────────────────────────────
function OptionIcon({
    optionKey,
    className,
}: {
    optionKey: string;
    className?: string;
}) {
    if (optionKey === "YES")
        return <Check className={cn("h-6 w-6 text-emerald-500", className)} />;
    if (optionKey === "NO")
        return <X className={cn("h-6 w-6 text-red-500", className)} />;
    if (optionKey === "ABSTAIN")
        return <Minus className={cn("h-6 w-6 text-slate-400", className)} />;
    return null;
}

function getOptionLabel(
    optionKey: string,
    label: string,
    t: TFunction<"voting">,
) {
    if (optionKey === "YES") return t("castVote.options.yes");
    if (optionKey === "NO") return t("castVote.options.no");
    if (optionKey === "ABSTAIN") return t("castVote.options.abstain");
    return label;
}

// ── Main Page ──────────────────────────────────────────────
export function CastVotePage() {
    const { t } = useTranslation(["voting"]);
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const voteId = id ?? "";

    const voteQuery = useVotesControllerGetVoteDetail(voteId, {
        query: { enabled: !!voteId },
    });
    const statusQuery = useVotesControllerGetVoterStatus(voteId, {
        query: { enabled: !!voteId },
    });
    const submitMutation = useSubmitBallot(voteId);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [step, setStep] = useState<CastVoteStep>("questions");
    const [answers, setAnswers] = useState<BallotAnswers>({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [submittedAt, setSubmittedAt] = useState<string | null>(null);

    // Compute ready units from voter status
    const readyUnits = useMemo(() => {
        if (!statusQuery.data) return [];
        return statusQuery.data.owningUnits.filter((u) => u.status === "READY");
    }, [statusQuery.data]);

    const questions = useMemo(
        () => voteQuery.data?.questions ?? [],
        [voteQuery.data?.questions],
    );
    const totalQuestions = questions.length;
    const currentQuestion = questions[currentQuestionIndex];

    // Calculate completion percentage based on answered questions
    const completedQuestions = useMemo(() => {
        if (readyUnits.length === 0 || totalQuestions === 0) return 0;
        let count = 0;
        for (let qi = 0; qi < totalQuestions; qi++) {
            const q = questions[qi];
            const allAnswered = readyUnits.every(
                (u) => answers[u.id]?.[q.id] !== undefined,
            );
            if (allAnswered) count++;
        }
        return count;
    }, [answers, readyUnits, questions, totalQuestions]);

    const completionPct =
        totalQuestions > 0
            ? Math.round((completedQuestions / totalQuestions) * 100)
            : 0;

    const selectAnswer = useCallback(
        (unitId: string, questionId: string, optionId: string) => {
            setAnswers((prev) => ({
                ...prev,
                [unitId]: {
                    ...prev[unitId],
                    [questionId]: optionId,
                },
            }));
        },
        [],
    );

    const handleNext = useCallback(() => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex((i) => i + 1);
        } else {
            setStep("review");
        }
    }, [currentQuestionIndex, totalQuestions]);

    const handlePrevious = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((i) => i - 1);
        }
    }, [currentQuestionIndex]);

    const handleSubmit = useCallback(() => {
        const ballotData: SubmitBallotBody = {
            ballots: readyUnits.map((unit) => ({
                unitId: unit.id,
                answers: questions.map((q) => ({
                    questionId: q.id,
                    optionId: answers[unit.id]?.[q.id] ?? "",
                })),
            })),
        };

        submitMutation.mutate(ballotData, {
            onSuccess: (data) => {
                setSubmittedAt(data.submittedAt);
                setShowSuccess(true);
            },
        });
    }, [readyUnits, questions, answers, submitMutation]);

    const hasAlreadyVoted = useMemo(() => {
        if (!statusQuery.data) return false;
        return statusQuery.data.owningUnits.some((u) => u.status === "VOTED");
    }, [statusQuery.data]);

    // ── Loading / Error ──────────────────────────────────
    if (voteQuery.isLoading || statusQuery.isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!voteQuery.data || !statusQuery.data) {
        return (
            <div className="flex h-96 items-center justify-center">
                <p className="text-destructive text-sm">
                    {t("castVote.error")}
                </p>
            </div>
        );
    }

    if (readyUnits.length === 0) {
        return (
            <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                    <ShieldCheck className="h-10 w-10 text-emerald-600" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-slate-900">
                    {hasAlreadyVoted
                        ? t("castVote.alreadyVoted.title")
                        : t("castVote.noUnits.title")}
                </h2>
                <p className="mb-8 text-slate-500">
                    {hasAlreadyVoted
                        ? t("castVote.alreadyVoted.description")
                        : t("castVote.noUnits.description")}
                </p>
                <Button
                    onClick={() => navigate(`/voting/${voteId}`)}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("castVote.backToDetail")}
                </Button>
            </div>
        );
    }

    const vote = voteQuery.data;

    // ── Review Step ──────────────────────────────────────
    if (step === "review") {
        return (
            <div className="mx-auto max-w-3xl space-y-6 py-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {t("castVote.review.title")}
                    </h1>
                    <p className="text-sm text-slate-500 italic">
                        {t("castVote.review.subtitle")}
                    </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <h3 className="mb-4 font-bold text-slate-800">
                        {t("castVote.review.selectedChoices")}
                    </h3>

                    <div className="space-y-6">
                        {readyUnits.map((unit) => (
                            <div
                                key={unit.id}
                                className="rounded-lg border border-slate-200 p-4"
                            >
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                                        <Home className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-900">
                                            {unit.name}
                                        </span>
                                        <span className="ml-2 text-sm text-blue-600">
                                            ({t("castVote.voteShare")}{" "}
                                            {unit.share})
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {questions.map((q, qi) => {
                                        const selectedOptionId =
                                            answers[unit.id]?.[q.id];
                                        const selectedOption = q.options.find(
                                            (o) => o.id === selectedOptionId,
                                        );
                                        return (
                                            <div
                                                key={q.id}
                                                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                                                        {qi + 1}
                                                    </span>
                                                    <span className="text-sm text-slate-700">
                                                        {q.title}
                                                    </span>
                                                </div>
                                                {selectedOption && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {getOptionLabel(
                                                                selectedOption.optionKey,
                                                                selectedOption.label,
                                                                t,
                                                            )}
                                                        </span>
                                                        <OptionIcon
                                                            optionKey={
                                                                selectedOption.optionKey
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setStep("questions");
                            setCurrentQuestionIndex(0);
                        }}
                    >
                        {t("castVote.review.editAnswers")}
                    </Button>
                    <Button
                        className="flex-1 bg-blue-600 font-semibold text-white hover:bg-blue-700"
                        size="lg"
                        disabled={submitMutation.isPending}
                        onClick={handleSubmit}
                    >
                        {submitMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ShieldCheck className="mr-2 h-4 w-4" />
                        )}
                        {t("castVote.review.submitVote")}
                    </Button>
                </div>

                <VoteSuccessModal
                    open={showSuccess}
                    onClose={() => navigate("/voting")}
                    submittedAt={submittedAt}
                />
            </div>
        );
    }

    // ── Question Step ────────────────────────────────────
    if (!currentQuestion) return null;

    // Check if all units have answered current question
    const allCurrentAnswered = readyUnits.every(
        (u) => answers[u.id]?.[currentQuestion.id] !== undefined,
    );

    return (
        <div className="mx-auto max-w-3xl space-y-6 py-8">
            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900">{vote.title}</h1>

            {/* Progress Bar */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                        {t("castVote.progress.question", {
                            current: currentQuestionIndex + 1,
                            total: totalQuestions,
                        })}
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                        {completionPct} % {t("castVote.progress.completed")}
                    </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{
                            width: `${totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0}%`,
                        }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-bold text-slate-900">
                    {currentQuestion.title}
                </h2>
                {currentQuestion.description && (
                    <p className="mt-2 text-sm text-slate-500">
                        {currentQuestion.description}
                    </p>
                )}
            </div>

            {/* Per-unit voting sections */}
            {readyUnits.map((unit) => (
                <div key={unit.id} className="space-y-3">
                    {/* Unit header */}
                    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                            {t("castVote.votingFor")}
                        </span>
                        <div className="mt-1 flex items-center justify-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                                <Home className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-bold text-slate-900">
                                {unit.name}
                            </span>
                            <span className="text-sm text-blue-600">
                                ({unit.share} {t("castVote.voteShareLabel")})
                            </span>
                        </div>
                    </div>

                    {/* Option Cards */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {currentQuestion.options.map((option) => {
                            const isSelected =
                                answers[unit.id]?.[currentQuestion.id] ===
                                option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() =>
                                        selectAnswer(
                                            unit.id,
                                            currentQuestion.id,
                                            option.id,
                                        )
                                    }
                                    className={cn(
                                        "flex flex-col items-center gap-2 rounded-lg border-2 bg-white p-5 transition-all hover:shadow-md",
                                        isSelected
                                            ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200"
                                            : "border-slate-200 hover:border-slate-300",
                                    )}
                                >
                                    {option.optionKey === "CUSTOM" ? (
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                                            {option.sortOrder}
                                        </span>
                                    ) : (
                                        <OptionIcon
                                            optionKey={option.optionKey}
                                            className="h-7 w-7"
                                        />
                                    )}
                                    <span className="text-sm font-medium text-slate-700">
                                        {getOptionLabel(
                                            option.optionKey,
                                            option.label,
                                            t,
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
                <Button
                    variant="outline"
                    disabled={currentQuestionIndex === 0}
                    onClick={handlePrevious}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t("castVote.navigation.previous")}
                </Button>
                <Button
                    disabled={!allCurrentAnswered}
                    onClick={handleNext}
                    className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                    {currentQuestionIndex < totalQuestions - 1
                        ? t("castVote.navigation.next")
                        : t("castVote.navigation.review")}
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
