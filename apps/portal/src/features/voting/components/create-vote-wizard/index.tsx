import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@hoa-mngr/ui";

import { CreateVoteBasicInfoStep } from "./steps/basic-info-step";
import { CreateVoteQuestionsStep } from "./steps/questions-step";
import { CreateVoteRulesetStep } from "./steps/ruleset-step";

export type CreateVoteStepId = "basic-info" | "ruleset" | "questions";

export function CreateVoteWizard() {
    const { t } = useTranslation(["voting"]);

    const [activeStep, setActiveStep] =
        useState<CreateVoteStepId>("basic-info");
    const [createdVoteId, setCreatedVoteId] = useState<string | null>(null);

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
        setActiveStep("ruleset");
    };

    const handleRulesetSuccess = () => {
        setActiveStep("questions");
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t("voting:create.title")}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t("voting:create.description")}
                </p>
            </div>

            <Accordion
                type="single"
                value={activeStep}
                className="w-full space-y-4"
            >
                <AccordionItem
                    value="basic-info"
                    className="bg-card rounded-lg border px-6 shadow-sm"
                >
                    <AccordionTrigger
                        hideChevron
                        className="pointer-events-none hover:no-underline"
                    >
                        <div className="flex items-center space-x-3 text-left">
                            {createdVoteId ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                            ) : activeStep === "basic-info" ? (
                                <CircleDot className="text-primary h-5 w-5 shrink-0" />
                            ) : (
                                <Circle className="text-muted-foreground h-5 w-5 shrink-0" />
                            )}
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
                        className="pointer-events-none hover:no-underline"
                    >
                        <div className="flex items-center space-x-3 text-left">
                            {activeStep === "ruleset" ? (
                                <CircleDot className="text-primary h-5 w-5 shrink-0" />
                            ) : activeStep === "basic-info" ? (
                                <Circle className="text-muted-foreground h-5 w-5 shrink-0" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                            )}
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
                        />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem
                    value="questions"
                    className="bg-card rounded-lg border px-6 shadow-sm"
                    disabled={!createdVoteId}
                >
                    <AccordionTrigger
                        hideChevron
                        className="pointer-events-none hover:no-underline"
                    >
                        <div className="flex items-center space-x-3 text-left">
                            {activeStep === "questions" ? (
                                <CircleDot className="text-primary h-5 w-5 shrink-0" />
                            ) : (
                                <Circle className="text-muted-foreground h-5 w-5 shrink-0" />
                            )}
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
        </div>
    );
}
