import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    StatusChip,
    toast,
} from "@hoa-mngr/ui";

import { VoteDetailResponseDto } from "@/api/generated/model";
import {
    getVotesControllerGetVoteDetailQueryKey,
    getVotesControllerGetVotesQueryKey,
    useVotesControllerGetVoteDetail,
} from "@/api/generated/votes/votes";

import { useScheduleVote } from "../../hooks/use-schedule-vote";
import { useUploadVoteDocument } from "../../hooks/use-upload-vote-document";
import { DeleteDraftVoteDialog } from "../delete-draft-vote-dialog";
import { VoteDocumentsSection } from "../vote-documents-section";
import { ScheduleValidationModal } from "../schedule-validation-modal";
import {
    SavedIndicator,
    WizardShell,
    type WizardSavedState,
    type WizardShellStep,
} from "./layout/wizard-shell";
import { CreateVoteBasicInfoStep } from "./steps/basic-info-step";
import { ModeStep } from "./steps/mode-step";
import { CreateVoteQuestionsStep } from "./steps/questions-step";
import { buildReviewChecks, ReviewStep } from "./steps/review-step";
import { CreateVoteRulesetStep } from "./steps/ruleset-step";

export type WizardStepId =
    | "mode"
    | "details"
    | "rules"
    | "questions"
    | "review";

const STEP_ORDER: WizardStepId[] = [
    "mode",
    "details",
    "rules",
    "questions",
    "review",
];

/** Only the active step is mounted, so exactly one form ever carries this id. */
const STEP_FORM_ID = "wizard-step-form";

const STEP_LABEL_KEYS: Record<WizardStepId, string> = {
    mode: "voting:wizard.steps.mode",
    details: "voting:wizard.steps.details",
    rules: "voting:wizard.steps.rules",
    questions: "voting:wizard.steps.questions",
    review: "voting:wizard.steps.review",
};

export interface CreateVoteWizardProps {
    voteId?: string;
}

export function CreateVoteWizard({
    voteId: initialVoteId,
}: CreateVoteWizardProps) {
    const navigate = useNavigate();
    const { t } = useTranslation(["voting"]);
    const queryClient = useQueryClient();

    const [activeStep, setActiveStep] = useState<WizardStepId>("mode");
    const [createdVoteId, setCreatedVoteId] = useState<string | null>(
        initialVoteId ?? null,
    );
    const [activeFormDirty, setActiveFormDirty] = useState(false);
    const [activeSaving, setActiveSaving] = useState(false);
    const [documentsSettling, setDocumentsSettling] = useState(false);
    // True while the rules step's draft has a blocking (tier1) legal-validity
    // issue — see CreateVoteRulesetStep's onBlockedChange.
    const [rulesetBlocked, setRulesetBlocked] = useState(false);
    // Free choice before a draft exists; once the vote is created, mode is
    // immutable, so voteData.mode (server truth) always wins once it loads.
    const [selectedMode, setSelectedMode] = useState<
        "PER_ROLLAM" | "ASSEMBLY_RECORD"
    >("PER_ROLLAM");

    const voteId = createdVoteId ?? initialVoteId ?? null;

    // Lives here (not in the details step) so queued files survive the
    // auto-advance to the rules step and uploads keep running across steps.
    const documentsUpload = useUploadVoteDocument(voteId);

    const voteQuery = useVotesControllerGetVoteDetail(voteId ?? "", {
        query: {
            enabled: !!voteId,
        },
    });

    const {
        handleSchedule,
        isConfirmOpen,
        setIsConfirmOpen,
        isValidationOpen,
        setIsValidationOpen,
        validationErrors,
        isPending,
    } = useScheduleVote(voteId ?? "", {
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: getVotesControllerGetVoteDetailQueryKey(voteId ?? ""),
            });
            queryClient.invalidateQueries({
                queryKey: getVotesControllerGetVotesQueryKey(),
            });
            navigate(`/voting/${voteId}`, { replace: true });
        },
    });

    const voteData = voteQuery.data as VoteDetailResponseDto | undefined;

    // Mode is immutable once the vote exists, so voteData.mode (server
    // truth) always wins over the local pre-creation selection.
    const mode = voteData?.mode ?? selectedMode;

    useEffect(() => {
        if (!createdVoteId) return;

        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };

        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [createdVoteId]);

    const goToStep = useCallback((step: WizardStepId) => {
        setActiveFormDirty(false);
        setActiveSaving(false);
        setRulesetBlocked(false);
        setActiveStep(step);
    }, []);

    const handleBasicInfoSuccess = async (id: string) => {
        setCreatedVoteId(id);
        queryClient.invalidateQueries({
            queryKey: getVotesControllerGetVoteDetailQueryKey(id),
        });

        // Hold the step until every queued/in-flight document upload has
        // settled; error rows keep the user here to retry or dismiss them.
        setDocumentsSettling(true);
        const allUploaded = await documentsUpload.flushAndSettle(id);
        setDocumentsSettling(false);

        if (!allUploaded) {
            toast.error(t("voting:create.documents.uploadsIncomplete"));
            return;
        }
        goToStep("rules");
    };

    const handleRulesetSuccess = () => {
        if (voteId) {
            queryClient.invalidateQueries({
                queryKey: getVotesControllerGetVoteDetailQueryKey(voteId),
            });
        }
        goToStep("questions");
    };

    const activeIndex = STEP_ORDER.indexOf(activeStep);
    const hasDraft = !!voteId;
    const questionCount = voteData?.questions?.length ?? 0;

    // Client-side mirror of the server's INCOMPLETE_VOTE checks — the server
    // (via useScheduleVote + ScheduleValidationModal) stays authoritative.
    // Undefined voteData (still loading) is treated as not schedulable.
    const reviewChecks = voteData ? buildReviewChecks(voteData) : [];
    const scheduleDisabled =
        isPending ||
        !voteData ||
        reviewChecks.some((check) => check.severity === "error" && !check.ok);

    const steps: WizardShellStep<WizardStepId>[] = STEP_ORDER.map(
        (id, index) => ({
            id,
            labelKey: STEP_LABEL_KEYS[id],
            state:
                index < activeIndex
                    ? "done"
                    : index === activeIndex
                      ? "active"
                      : "upcoming",
            enabled:
                !documentsSettling &&
                (id === "mode" || id === "details" || hasDraft),
            badge: id === "questions" ? questionCount : undefined,
        }),
    );

    const title = voteData?.title ?? "";
    const isDraft = voteData?.status === "DRAFT";

    // "saved" is the only state that needs a draft behind it — an untouched new
    // vote shows nothing, but typing into step 1 still reports "Unsaved changes".
    const savedState: WizardSavedState | null =
        activeSaving || documentsSettling
            ? "saving"
            : activeFormDirty
              ? "dirty"
              : hasDraft
                ? "saved"
                : null;

    // Controlled by the review step's own "Schedule vote" button (card + footer)
    // via `setIsConfirmOpen(true)` — no DialogTrigger needed here.
    const scheduleDialog = (
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t("voting:detail.actions.scheduleConfirmTitle")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("voting:detail.actions.scheduleConfirmDescription")}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsConfirmOpen(false)}
                    >
                        {t("voting:detail.actions.cancel")}
                    </Button>
                    <Button onClick={handleSchedule} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="animate-spin" />
                        ) : null}
                        {t("voting:detail.actions.confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    const footer = (
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <Button
                variant="secondary"
                disabled={activeIndex === 0}
                onClick={() => {
                    if (activeIndex > 0) goToStep(STEP_ORDER[activeIndex - 1]);
                }}
            >
                {t("voting:wizard.back")}
            </Button>
            <span className="text-muted-foreground text-sm">
                {t("voting:wizard.stepOf", {
                    n: activeIndex + 1,
                    total: STEP_ORDER.length,
                })}
            </span>
            {activeStep === "mode" ? (
                <Button onClick={() => goToStep("details")}>
                    {t("voting:wizard.continue")}
                </Button>
            ) : activeStep === "questions" ? (
                <Button onClick={() => goToStep("review")}>
                    {t("voting:wizard.toReview")}
                </Button>
            ) : activeStep === "review" && mode === "ASSEMBLY_RECORD" ? (
                // An assembly record is never scheduled: the meeting already
                // happened, so the wizard hands over to the recording screen.
                <Button
                    onClick={() =>
                        navigate(`/voting/${voteId}/assembly-record`)
                    }
                    disabled={scheduleDisabled}
                >
                    <Send />
                    {t("voting:wizard.review.startRecordingAction")}
                </Button>
            ) : activeStep === "review" ? (
                // Mirrors the review card's primary Schedule action — same
                // disabled logic, same dialog (opened via setIsConfirmOpen).
                <Button
                    onClick={() => setIsConfirmOpen(true)}
                    disabled={scheduleDisabled}
                >
                    {isPending ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <Send />
                    )}
                    {t("voting:wizard.review.scheduleAction")}
                </Button>
            ) : (
                <Button
                    type="submit"
                    form={STEP_FORM_ID}
                    disabled={
                        activeSaving ||
                        documentsSettling ||
                        (activeStep === "rules" && rulesetBlocked)
                    }
                >
                    {activeSaving || documentsSettling ? (
                        <Loader2 className="animate-spin" />
                    ) : null}
                    {t("voting:wizard.continue")}
                </Button>
            )}
        </div>
    );

    return (
        <>
            <WizardShell<WizardStepId>
                heading={
                    <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                            {t("voting:wizard.newVote")}
                            {title ? ` · ${title}` : ""}
                        </p>
                        {isDraft && (
                            <StatusChip
                                variant="neutral"
                                dot={false}
                                className="shrink-0"
                            >
                                {t("voting:wizard.draft")}
                            </StatusChip>
                        )}
                    </div>
                }
                headerEnd={
                    savedState ? (
                        <div
                            aria-live="polite"
                            className="flex shrink-0 items-center"
                        >
                            <SavedIndicator state={savedState} />
                        </div>
                    ) : undefined
                }
                exitTo="/voting"
                exitLabel={t("voting:wizard.exit")}
                railTitle={t("voting:wizard.railTitle")}
                railNote={t("voting:wizard.note")}
                steps={steps}
                onStepSelect={goToStep}
                railFooter={
                    voteData?.status === "DRAFT" && voteId ? (
                        <DeleteDraftVoteDialog voteId={voteId} />
                    ) : undefined
                }
                footer={footer}
            >
                {activeStep === "mode" && (
                    <div className="space-y-6">
                        <div>
                            <h1 className="font-display text-2xl font-extrabold tracking-tight">
                                {t("voting:create.steps.mode.title")}
                            </h1>
                            <p className="text-muted-foreground mt-1.5 text-sm">
                                {t("voting:create.steps.mode.description")}
                            </p>
                        </div>
                        <ModeStep value={mode} onChange={setSelectedMode} />
                    </div>
                )}

                {activeStep === "details" && (
                    <>
                        <CreateVoteBasicInfoStep
                            formId={STEP_FORM_ID}
                            onSuccess={handleBasicInfoSuccess}
                            voteId={voteId}
                            mode={mode}
                            initialData={voteData}
                            onDirtyChange={setActiveFormDirty}
                            onSavingChange={setActiveSaving}
                        />
                        <div className="mt-8">
                            <VoteDocumentsSection
                                voteId={voteId}
                                documents={voteData?.documents ?? []}
                                uploads={documentsUpload.uploads}
                                addFile={documentsUpload.addFile}
                                dismiss={documentsUpload.dismiss}
                            />
                        </div>
                    </>
                )}

                {activeStep === "rules" && (
                    <CreateVoteRulesetStep
                        formId={STEP_FORM_ID}
                        voteId={voteId}
                        mode={mode}
                        onSuccess={handleRulesetSuccess}
                        initialData={voteData?.ruleset}
                        onDirtyChange={setActiveFormDirty}
                        onSavingChange={setActiveSaving}
                        onBlockedChange={setRulesetBlocked}
                    />
                )}

                {activeStep === "questions" && (
                    <CreateVoteQuestionsStep
                        voteId={voteId}
                        onSavingChange={setActiveSaving}
                    />
                )}

                {activeStep === "review" && voteData && (
                    <ReviewStep
                        vote={voteData}
                        onEditStep={goToStep}
                        onScheduleClick={() => setIsConfirmOpen(true)}
                        scheduleDisabled={scheduleDisabled}
                    />
                )}
            </WizardShell>

            {scheduleDialog}

            <ScheduleValidationModal
                open={isValidationOpen}
                onOpenChange={setIsValidationOpen}
                errors={validationErrors}
                voteId={voteId ?? ""}
                isAlreadyOnEditPage={true}
            />
        </>
    );
}
