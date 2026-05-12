import { useQueryClient } from "@tanstack/react-query";
import {
    CheckCircle2,
    Circle,
    CircleDot,
    Loader2,
    Send,
    Eye,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router";

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
    getVotesControllerGetVotesQueryKey,
    useVotesControllerGetVoteDetail,
} from "@/api/generated/votes/votes";

import { ScheduleValidationModal } from "../schedule-validation-modal";
import { CreateVoteBasicInfoStep } from "./steps/basic-info-step";
import { CreateVoteQuestionsStep } from "./steps/questions-step";
import { CreateVoteRulesetStep } from "./steps/ruleset-step";
import { useScheduleVote } from "../../hooks/use-schedule-vote";

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
            queryClient.invalidateQueries({
                queryKey: getVotesControllerGetVotesQueryKey(),
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
                    {initialVoteId ? t("create.titleEdit") : t("create.title")}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t("create.description")}
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
                                ? "cursor-pointer hover:no-underline"
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
                                {t("create.steps.basicInfo.title")}
                            </h2>
                        </div>
                    </AccordionTrigger>

                    <AccordionContent className="mt-2 border-t pt-4 pb-6">
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
                                ? "cursor-pointer hover:no-underline"
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
                                {t("create.steps.ruleset.title")}
                            </h2>
                        </div>
                    </AccordionTrigger>

                    <AccordionContent className="mt-2 border-t pt-4 pb-6">
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
                                ? "cursor-pointer hover:no-underline"
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
                                {t("create.steps.questions.title")}
                            </h2>
                        </div>
                    </AccordionTrigger>

                    <AccordionContent className="mt-2 border-t pt-4 pb-6">
                        <CreateVoteQuestionsStep voteId={createdVoteId} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {(initialVoteId || createdVoteId) && (
                <div className="mt-8 flex items-center justify-between gap-3 border-t pt-8">
                    <Button variant="ghost" asChild className="h-11 px-6">
                        <Link to="/voting">{t("create.actions.back")}</Link>
                    </Button>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            asChild
                            className="text-primary hover:text-primary hover:bg-primary/5 h-11 px-6"
                        >
                            <Link
                                to={`/voting/${initialVoteId ?? createdVoteId}`}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                {t("create.actions.finish")}
                            </Link>
                        </Button>

                        <Dialog
                            open={isConfirmOpen}
                            onOpenChange={setIsConfirmOpen}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    disabled={isPending}
                                    className="h-11 px-6"
                                >
                                    {isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    {t("detail.actions.schedule")}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {t(
                                            "detail.actions.scheduleConfirmTitle",
                                        )}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t(
                                            "detail.actions.scheduleConfirmDescription",
                                        )}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsConfirmOpen(false)}
                                    >
                                        {t("detail.actions.cancel")}
                                    </Button>
                                    <Button
                                        onClick={handleSchedule}
                                        disabled={isPending}
                                    >
                                        {isPending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        {t("detail.actions.confirm")}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
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
