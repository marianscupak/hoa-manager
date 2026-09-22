import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router";

import {
    ConfirmDialog,
    ErrorState,
    PageLoading,
    StatusChip,
    toast,
} from "@hoa-mngr/ui";

import { getApiErrorCode, showApiError } from "@/api/error-utils";
import {
    useVotesControllerGetVoteDetail,
    useVotesControllerGetVoteParticipation,
    useVotesControllerGetVoteTurnout,
    votesControllerRecordPaperBallot,
} from "@/api/generated/votes/votes";
import { userAtom } from "@/auth/atoms";

import {
    WizardShell,
    type WizardShellStep,
} from "../components/create-vote-wizard/layout/wizard-shell";
import { AnswersStep } from "../components/paper-ballot/answers-step";
import { BallotSignerStep } from "../components/paper-ballot/ballot-signer-step";
import { ChooseUnitStep } from "../components/paper-ballot/choose-unit-step";
import { PaperBallotFooter } from "../components/paper-ballot/paper-ballot-footer";
import { RecordedState } from "../components/paper-ballot/recorded-state";
import { ReviewStep } from "../components/paper-ballot/review-step";
import { useBallotAttachment } from "../hooks/use-ballot-attachment";
import { invalidateVoteResultQueries } from "../utils/invalidate-vote-result-queries";
import { defaultSignerOwnerId, signerOptions } from "../utils/signer-options";

export type PaperBallotStepId = "unit" | "ballot" | "answers" | "review";

const STEP_ORDER: PaperBallotStepId[] = ["unit", "ballot", "answers", "review"];

export function RecordPaperBallotPage() {
    const { t } = useTranslation(["voting", "common"]);
    const { id } = useParams<{ id: string }>();
    const voteId = id ?? "";

    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAtomValue(userAtom);

    const [step, setStep] = useState<PaperBallotStepId | "done">("unit");
    const [unitId, setUnitId] = useState<string | null>(null);
    const [signerOwnerId, setSignerOwnerId] = useState<string | null>(null);
    const [qIndex, setQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [confirmed, setConfirmed] = useState(false);
    const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
    const [submittedAt, setSubmittedAt] = useState<string | null>(null);

    const { attachment, isUploading, progress, upload, remove, clear } =
        useBallotAttachment(voteId);

    const voteQuery = useVotesControllerGetVoteDetail(voteId, {
        query: { enabled: !!voteId },
    });
    const participationQuery = useVotesControllerGetVoteParticipation(voteId, {
        query: { enabled: !!voteId },
    });
    const turnoutQuery = useVotesControllerGetVoteTurnout(voteId, {
        query: { enabled: !!voteId },
    });

    const formatDate = useCallback(
        (iso: string) => format(new Date(iso), "d. M. yyyy"),
        [],
    );

    const resetFlow = useCallback(() => {
        void remove();
        setUnitId(null);
        setSignerOwnerId(null);
        setQIndex(0);
        setAnswers({});
        setConfirmed(false);
        setStep("unit");
    }, [remove]);

    const handleRecord = useCallback(
        (selected: string) => {
            const unit = participationQuery.data?.units.find(
                (u) => u.unitId === selected,
            );
            setUnitId(selected);
            setSignerOwnerId(
                unit ? defaultSignerOwnerId(signerOptions(unit)) : null,
            );
            setStep("ballot");
        },
        [participationQuery.data],
    );

    // Rail jumps. Going back to step 1 means picking a different unit, so the
    // whole transcription is discarded — carrying one unit's answers onto
    // another unit's ballot is the one mistake this flow must not allow.
    // Every other jump preserves state, which is what makes step 3's "Change"
    // link work.
    const handleStepSelect = useCallback(
        (selected: PaperBallotStepId) => {
            if (selected === "unit") {
                resetFlow();
                return;
            }
            setStep(selected);
        },
        [resetFlow],
    );

    const steps: WizardShellStep<PaperBallotStepId>[] = useMemo(() => {
        const activeIndex =
            step === "done" ? STEP_ORDER.length : STEP_ORDER.indexOf(step);
        return STEP_ORDER.map((stepId, index) => ({
            id: stepId,
            labelKey: `voting:paperBallot.steps.${stepId}`,
            state:
                index < activeIndex
                    ? "done"
                    : index === activeIndex
                      ? "active"
                      : "upcoming",
            enabled: step !== "done" && index < activeIndex,
        }));
    }, [step]);

    const recordMutation = useMutation({
        mutationFn: () =>
            votesControllerRecordPaperBallot(voteId, {
                unitId: unitId as string,
                signerOwnerId: signerOwnerId as string,
                attachmentDocumentId: attachment?.documentId as string,
                answers: (voteQuery.data?.questions ?? []).map((q) => ({
                    questionId: q.id,
                    optionId: answers[q.id],
                })),
            }),
        onSuccess: (data) => {
            // State-only: the attachment is now the permanent evidence for a
            // recorded ballot, not an orphaned upload — remove() would
            // delete it from R2, and Exit's discard dialog must not offer to
            // discard a ballot that has already been recorded.
            clear();
            setSubmittedAt(String(data.submittedAt));
            setStep("done");
            invalidateVoteResultQueries(queryClient, voteId);
        },
        onError: (error) => {
            // A ballot that arrived in the app mid-transcription is not a
            // toast-and-stay situation: the unit is settled, so go back to a
            // refetched list where the row now reads "Voted".
            if (getApiErrorCode(error) === "BALLOT_ALREADY_CAST") {
                toast.error(t("voting:paperBallot.alreadyCast"));
                // The ballot landed while this was being transcribed, so the
                // standings moved without this flow doing it — everything the
                // results view shows is stale, not just the unit list.
                invalidateVoteResultQueries(queryClient, voteId);
                resetFlow();
                return;
            }
            showApiError(error);
        },
    });

    if (voteQuery.isLoading) return <PageLoading />;
    if (voteQuery.isError || !voteQuery.data) {
        return <ErrorState message={t("voting:list.error")} />;
    }

    const vote = voteQuery.data;
    if (vote.status !== "OPEN") {
        return <Navigate to={`/voting/${voteId}`} replace />;
    }

    const selectedUnit = participationQuery.data?.units.find(
        (u) => u.unitId === unitId,
    );
    const currentQuestion = vote.questions[qIndex];
    const signerName = selectedUnit
        ? signerOptions(selectedUnit).find((o) => o.ownerId === signerOwnerId)
              ?.displayName ?? ""
        : "";
    const actorName = user?.fullName ?? user?.email ?? "";

    return (
        <>
            <WizardShell<PaperBallotStepId>
                heading={
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                            {t("voting:paperBallot.headerTitle")} · {vote.title}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                            {t("voting:paperBallot.headerSubtitle")}
                        </p>
                    </div>
                }
                headerEnd={
                    <div className="flex shrink-0 items-center gap-3">
                        <StatusChip variant="success">
                            {t("voting:list.status.OPEN")}
                        </StatusChip>
                        {vote.scheduledTo && (
                            <span className="text-muted-foreground hidden text-xs sm:inline">
                                {t("voting:paperBallot.closesOn", {
                                    date: formatDate(String(vote.scheduledTo)),
                                })}
                            </span>
                        )}
                    </div>
                }
                exitTo={`/voting/${voteId}`}
                exitLabel={t("voting:paperBallot.exit")}
                onExitIntercept={() => {
                    if (!attachment) return false;
                    setExitConfirmOpen(true);
                    return true;
                }}
                railTitle={t("voting:paperBallot.railTitle")}
                railNote={t("voting:paperBallot.railNote")}
                contentMaxWidth={step === "unit" ? "max-w-3xl" : "max-w-2xl"}
                steps={steps}
                onStepSelect={handleStepSelect}
                footer={
                    step === "ballot" ? (
                        <PaperBallotFooter
                            onBack={resetFlow}
                            onNext={() => setStep("answers")}
                            backLabel={t("voting:paperBallot.back")}
                            nextLabel={t("voting:paperBallot.ballot.continue")}
                            nextDisabled={!attachment || !signerOwnerId}
                        />
                    ) : step === "answers" ? (
                        <PaperBallotFooter
                            onBack={() =>
                                qIndex === 0
                                    ? setStep("ballot")
                                    : setQIndex((i) => i - 1)
                            }
                            onNext={() => {
                                if (qIndex < vote.questions.length - 1) {
                                    setQIndex((i) => i + 1);
                                } else {
                                    setStep("review");
                                }
                            }}
                            backLabel={t("voting:paperBallot.back")}
                            nextLabel={
                                qIndex < vote.questions.length - 1
                                    ? t("voting:paperBallot.answers.next")
                                    : t("voting:paperBallot.answers.review")
                            }
                            nextDisabled={
                                currentQuestion === undefined ||
                                answers[currentQuestion.id] === undefined
                            }
                        />
                    ) : step === "review" ? (
                        <PaperBallotFooter
                            onBack={() => {
                                setStep("answers");
                                setQIndex(vote.questions.length - 1);
                            }}
                            onNext={() => recordMutation.mutate()}
                            backLabel={t("voting:paperBallot.back")}
                            nextLabel={t("voting:paperBallot.review.submit", {
                                unit: selectedUnit?.unitNo ?? "",
                            })}
                            nextDisabled={!confirmed}
                            isPending={recordMutation.isPending}
                        />
                    ) : null
                }
            >
                {step === "unit" && (
                    <ChooseUnitStep
                        units={participationQuery.data?.units ?? []}
                        turnout={turnoutQuery.data}
                        isLoading={participationQuery.isLoading}
                        voteId={voteId}
                        onRecord={handleRecord}
                        formatDate={formatDate}
                    />
                )}
                {step === "ballot" && selectedUnit && (
                    <BallotSignerStep
                        unit={selectedUnit}
                        attachment={attachment}
                        isUploading={isUploading}
                        progress={progress}
                        onUpload={(file) => {
                            void upload(file);
                            setConfirmed(false);
                        }}
                        onRemove={() => {
                            void remove();
                            setConfirmed(false);
                        }}
                        signerOwnerId={signerOwnerId}
                        onSignerChange={(ownerId) => {
                            setSignerOwnerId(ownerId);
                            setConfirmed(false);
                        }}
                    />
                )}
                {step === "answers" && selectedUnit && currentQuestion && (
                    <AnswersStep
                        question={currentQuestion}
                        questionIndex={qIndex}
                        totalQuestions={vote.questions.length}
                        unitNo={selectedUnit.unitNo}
                        signerName={signerName}
                        selectedOptionId={answers[currentQuestion.id]}
                        onSelect={(optionId) => {
                            setAnswers((prev) => ({
                                ...prev,
                                [currentQuestion.id]: optionId,
                            }));
                            setConfirmed(false);
                        }}
                        onChangeBallot={() => setStep("ballot")}
                    />
                )}
                {step === "review" && selectedUnit && attachment && (
                    <ReviewStep
                        unit={selectedUnit}
                        signerName={signerName}
                        attachment={attachment}
                        questions={vote.questions}
                        answers={answers}
                        confirmed={confirmed}
                        onConfirmedChange={setConfirmed}
                    />
                )}
                {step === "done" && selectedUnit && submittedAt && (
                    <RecordedState
                        unitNo={selectedUnit.unitNo}
                        signerName={signerName}
                        actorName={actorName}
                        submittedAt={submittedAt}
                        onRecordAnother={() => {
                            resetFlow();
                            setSubmittedAt(null);
                        }}
                        onBackToVote={() => navigate(`/voting/${voteId}`)}
                    />
                )}
            </WizardShell>
            <ConfirmDialog
                open={exitConfirmOpen}
                onOpenChange={setExitConfirmOpen}
                title={t("voting:paperBallot.exitConfirm.title")}
                description={t("voting:paperBallot.exitConfirm.description")}
                confirmLabel={t("voting:paperBallot.exitConfirm.confirm")}
                cancelLabel={t("common:cancel")}
                confirmVariant="destructive"
                onConfirm={() => {
                    void remove();
                    navigate(`/voting/${voteId}`);
                }}
            />
        </>
    );
}
