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

import {
    Button,
    Card,
    ErrorState,
    formatPercent,
    PageLoading,
} from "@hoa-mngr/ui";
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
        return <Check className={cn("text-success h-6 w-6", className)} />;
    if (optionKey === "NO")
        return <X className={cn("text-destructive h-6 w-6", className)} />;
    if (optionKey === "ABSTAIN")
        return <Minus className={cn("text-faint h-6 w-6", className)} />;
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
    const { t } = useTranslation(["voting", "common"]);
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
        return <PageLoading />;
    }

    if (!voteQuery.data || !statusQuery.data) {
        return (
            <ErrorState
                message={t("castVote.error")}
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            void voteQuery.refetch();
                            void statusQuery.refetch();
                        }}
                    >
                        {t("common:retry")}
                    </Button>
                }
            />
        );
    }

    if (readyUnits.length === 0) {
        return (
            <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-20 text-center">
                <div className="bg-success-muted mb-6 flex h-20 w-20 items-center justify-center rounded-full">
                    <ShieldCheck className="text-success-tint-foreground h-10 w-10" />
                </div>
                <h2 className="font-display text-foreground mb-2 text-2xl font-extrabold tracking-tight">
                    {hasAlreadyVoted
                        ? t("castVote.alreadyVoted.title")
                        : t("castVote.noUnits.title")}
                </h2>
                <p className="text-muted-foreground mb-8">
                    {hasAlreadyVoted
                        ? t("castVote.alreadyVoted.description")
                        : t("castVote.noUnits.description")}
                </p>
                <Button onClick={() => navigate(`/voting/${voteId}`)}>
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
                    <h1 className="font-display text-foreground text-2xl font-extrabold tracking-tight">
                        {t("castVote.review.title")}
                    </h1>
                    <p className="text-muted-foreground text-sm italic">
                        {t("castVote.review.subtitle")}
                    </p>
                </div>

                <Card className="p-6">
                    <h3 className="mb-4 font-bold">
                        {t("castVote.review.selectedChoices")}
                    </h3>

                    <div className="space-y-6">
                        {readyUnits.map((unit) => (
                            <div
                                key={unit.id}
                                className="rounded-panel border-hairline border p-4"
                            >
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="bg-primary-tint flex h-9 w-9 items-center justify-center rounded-lg">
                                        <Home className="text-primary h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="text-foreground font-semibold">
                                            {unit.name}
                                        </span>
                                        <span className="text-primary ml-2 text-sm">
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
                                                className="border-hairline bg-muted/50 rounded-panel flex items-center justify-between border px-4 py-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-muted text-secondary-foreground flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold">
                                                        {qi + 1}
                                                    </span>
                                                    <span className="text-secondary-foreground text-sm">
                                                        {q.title}
                                                    </span>
                                                </div>
                                                {selectedOption && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-secondary-foreground text-sm font-medium">
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
                </Card>

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
                        className="flex-1 font-semibold"
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
            <h1 className="font-display text-foreground text-2xl font-extrabold tracking-tight">
                {vote.title}
            </h1>

            {/* Progress Bar */}
            <Card className="p-4">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-secondary-foreground text-sm font-medium">
                        {t("castVote.progress.question", {
                            current: currentQuestionIndex + 1,
                            total: totalQuestions,
                        })}
                    </span>
                    <span className="text-primary text-sm font-bold">
                        {formatPercent(completionPct, 0)}{" "}
                        {t("castVote.progress.completed")}
                    </span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{
                            width: `${totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0}%`,
                        }}
                    />
                </div>
            </Card>

            {/* Question Card */}
            <Card className="p-6">
                <h2 className="font-display text-title font-extrabold tracking-tight">
                    {currentQuestion.title}
                </h2>
                {currentQuestion.description && (
                    <p className="text-muted-foreground mt-2 text-sm">
                        {currentQuestion.description}
                    </p>
                )}
            </Card>

            {/* Per-unit voting sections */}
            {readyUnits.map((unit) => (
                <div key={unit.id} className="space-y-3">
                    {/* Unit header */}
                    <Card className="p-4 text-center">
                        <span className="text-faint text-xs font-semibold tracking-wider uppercase">
                            {t("castVote.votingFor")}
                        </span>
                        <div className="mt-1 flex items-center justify-center gap-2">
                            <div className="bg-primary-tint flex h-7 w-7 items-center justify-center rounded-lg">
                                <Home className="text-primary h-4 w-4" />
                            </div>
                            <span className="text-foreground font-bold">
                                {unit.name}
                            </span>
                            <span className="text-primary text-sm">
                                ({unit.share} {t("castVote.voteShareLabel")})
                            </span>
                        </div>
                    </Card>

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
                                        "focus-visible:ring-ring flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                                        isSelected
                                            ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                                            : "border-border bg-card hover:bg-muted/50",
                                    )}
                                >
                                    {option.optionKey === "CUSTOM" ? (
                                        <span className="bg-muted text-secondary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                                            {option.sortOrder}
                                        </span>
                                    ) : (
                                        <OptionIcon
                                            optionKey={option.optionKey}
                                            className="h-7 w-7"
                                        />
                                    )}
                                    <span className="text-secondary-foreground text-sm font-medium">
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
                    className="gap-2"
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
