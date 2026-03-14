import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, CircleDot, Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@hoa-mngr/ui";

import { VoteDetailResponseDto } from "@/api/generated/model";
import {
    getVotesControllerGetVoteDetailQueryKey,
    useVotesControllerGetVoteDetail,
} from "@/api/generated/votes/votes";

import { useScheduleVote } from "../../hooks/use-schedule-vote";
import { ScheduleValidationModal } from "../schedule-validation-modal";
import { CreateVoteBasicInfoStep } from "./steps/basic-info-step";
import { CreateVoteQuestionsStep } from "./steps/questions-step";
import { CreateVoteRulesetStep } from "./steps/ruleset-step";

export type CreateVoteStepId = "basic-info" | "ruleset" | "questions";

export interface CreateVoteWizardProps {
    voteId?: string;
}

export function CreateVoteWizard({
    voteId: initialVoteId,
}: CreateVoteWizardProps) {
    const navigate = useNavigate();
    const { t } = useTranslation(["voting"]);
    const queryClient = useQueryClient();

    const [activeStep, setActiveStep] =
        useState<CreateVoteStepId>("basic-info");
    const [createdVoteId, setCreatedVoteId] = useState<string | null>(
        initialVoteId ?? null,
    );

    const voteQuery = useVotesControllerGetVoteDetail(createdVoteId ?? "", {
        query: {
            enabled: !!createdVoteId,
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
    } = useScheduleVote(initialVoteId ?? createdVoteId ?? "", {
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: getVotesControllerGetVoteDetailQueryKey(
                    initialVoteId ?? createdVoteId ?? "",
                ),
            });
            navigate(`/voting/${initialVoteId ?? createdVoteId}`, {
                replace: true,
            });
        },
    });

    const voteData = voteQuery.data as VoteDetailResponseDto | undefined;

    useEffect(() => {
        if (!createdVoteId) return;

        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };

        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [createdVoteId]);

    const handleBasicInfoSuccess = (id: string) => {
        setCreatedVoteId(id);
        queryClient.invalidateQueries({
            queryKey: getVotesControllerGetVoteDetailQueryKey(id),
        });
        setActiveStep("ruleset");
    };

    const handleRulesetSuccess = () => {
        if (createdVoteId) {
            queryClient.invalidateQueries({
                queryKey:
                    getVotesControllerGetVoteDetailQueryKey(createdVoteId),
            });
        }
        setActiveStep("questions");
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {initialVoteId
                        ? t("voting:create.titleEdit")
                        : t("voting:create.title")}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t("voting:create.description")}
                </p>
            </div>

            <Accordion
                type="single"
                value={activeStep}
                onValueChange={(value) => {
                    if (value && createdVoteId) {
                        setActiveStep(value as CreateVoteStepId);
                    }
                }}
                className="w-full space-y-4"
            >
                <AccordionItem
                    value="basic-info"
                    className="bg-card rounded-lg border px-6 shadow-sm"
                >
                    <AccordionTrigger
                        hideChevron
                        className={
                            createdVoteId
                                ? "hover:no-underline"
                                : "pointer-events-none hover:no-underline"
                        }
                    >
                        <div className="flex items-center space-x-3 text-left">
                            {!initialVoteId &&
                                (createdVoteId ? (
                                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                                ) : activeStep === "basic-info" ? (
                                    <CircleDot className="text-primary h-5 w-5 shrink-0" />
                                ) : (
                                    <Circle className="text-muted-foreground h-5 w-5 shrink-0" />
                                ))}
                            <h2 className="text-xl font-semibold">
                                {t("voting:create.steps.basicInfo.title")}
                            </h2>
                        </div>
                    </AccordionTrigger>

                    <AccordionContent className="mt-2 border-t pt-4 pb-6">
                        <p className="text-muted-foreground mb-6 text-sm">
                            {t("voting:create.steps.basicInfo.description")}
                        </p>

                        <CreateVoteBasicInfoStep
                            onSuccess={handleBasicInfoSuccess}
                            isSaved={!!createdVoteId}
                            voteId={createdVoteId}
                            initialData={voteData}
                        />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem
                    value="ruleset"
                    className="bg-card rounded-lg border px-6 shadow-sm"
                    disabled={!createdVoteId}
                >
                    <AccordionTrigger
                        hideChevron
                        className={
                            createdVoteId
                                ? "hover:no-underline"
                                : "pointer-events-none hover:no-underline"
                        }
                    >
                        <div className="flex items-center space-x-3 text-left">
                            {!initialVoteId &&
                                (activeStep === "ruleset" ? (
                                    <CircleDot className="text-primary h-5 w-5 shrink-0" />
                                ) : activeStep === "basic-info" ? (
                                    <Circle className="text-muted-foreground h-5 w-5 shrink-0" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                                ))}
                            <h2 className="text-xl font-semibold">
                                {t("voting:create.steps.ruleset.title")}
                            </h2>
                        </div>
                    </AccordionTrigger>

                    <AccordionContent className="mt-2 border-t pt-4 pb-6">
                        <p className="text-muted-foreground mb-6 text-sm">
                            {t("voting:create.steps.ruleset.description")}
                        </p>

                        <CreateVoteRulesetStep
                            voteId={createdVoteId}
                            onSuccess={handleRulesetSuccess}
                            initialData={voteData?.ruleset}
                        />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem
                    value="questions"
                    className="bg-card rounded-lg border px-6 shadow-sm"
                    disabled={!createdVoteId && !initialVoteId}
                >
                    <AccordionTrigger
                        hideChevron
                        className={
                            createdVoteId
                                ? "hover:no-underline"
                                : "pointer-events-none hover:no-underline"
                        }
                    >
                        <div className="flex items-center space-x-3 text-left">
                            {!initialVoteId &&
                                (activeStep === "questions" ? (
                                    <CircleDot className="text-primary h-5 w-5 shrink-0" />
                                ) : (
                                    <Circle className="text-muted-foreground h-5 w-5 shrink-0" />
                                ))}
                            <h2 className="text-xl font-semibold">
                                {t("voting:create.steps.questions.title")}
                            </h2>
                        </div>
                    </AccordionTrigger>

                    <AccordionContent className="mt-2 border-t pt-4 pb-6">
                        <p className="text-muted-foreground mb-6 text-sm">
                            {t("voting:create.steps.questions.description")}
                        </p>

                        <CreateVoteQuestionsStep voteId={createdVoteId} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {initialVoteId && (
                <div className="mt-8 flex justify-end gap-3 border-t pt-6">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/voting/${initialVoteId}`)}
                    >
                        {t("voting:create.actions.back")}
                    </Button>
                    <Dialog
                        open={isConfirmOpen}
                        onOpenChange={setIsConfirmOpen}
                    >
                        <DialogTrigger asChild>
                            <Button disabled={isPending}>
                                {isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {t("voting:detail.actions.schedule")}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {t(
                                        "voting:detail.actions.scheduleConfirmTitle",
                                    )}
                                </DialogTitle>
                                <DialogDescription>
                                    {t(
                                        "voting:detail.actions.scheduleConfirmDescription",
                                    )}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsConfirmOpen(false)}
                                >
                                    {t("voting:detail.actions.cancel")}
                                </Button>
                                <Button
                                    onClick={handleSchedule}
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    {t("voting:detail.actions.confirm")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            <ScheduleValidationModal
                open={isValidationOpen}
                onOpenChange={setIsValidationOpen}
                errors={validationErrors}
                voteId={initialVoteId ?? createdVoteId ?? ""}
                isAlreadyOnEditPage={true}
            />
        </div>
    );
}
