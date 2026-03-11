import { useIsMutating } from "@tanstack/react-query";
import { Loader2, Plus, CheckCircle2, Flag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Button } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import {
    CreateVoteQuestionDtoType,
    VoteDetailResponseDto,
} from "@/api/generated/model";
import {
    useVotesControllerCreateVoteQuestion,
    useVotesControllerGetVoteDetail,
} from "@/api/generated/votes/votes";

import { QuestionsList } from "../questions/questions-list";

interface CreateVoteQuestionsStepProps {
    voteId: string | null;
}

export function CreateVoteQuestionsStep({
    voteId,
}: CreateVoteQuestionsStepProps) {
    const { t } = useTranslation(["voting"]);
    const navigate = useNavigate();

    const voteQuery = useVotesControllerGetVoteDetail(voteId ?? "", {
        query: { enabled: !!voteId },
    });

    const createQuestionMutation = useVotesControllerCreateVoteQuestion();

    const isMutating = useIsMutating({
        predicate: (mutation) => {
            const key = mutation.options.mutationKey?.[0];
            return typeof key === "string" && key.startsWith("votesController");
        },
    });

    const handleAddQuestion = () => {
        if (!voteId) return;

        createQuestionMutation.mutate(
            {
                id: voteId,
                data: {
                    title: t("voting:create.steps.questions.defaultTitle"),
                    type: CreateVoteQuestionDtoType.YES_NO,
                },
            },
            {
                onSuccess: () => {
                    voteQuery.refetch();
                },
                onError: showApiError,
            },
        );
    };

    if (!voteId) {
        return null;
    }

    if (voteQuery.isLoading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (voteQuery.isError) {
        return (
            <div className="text-destructive py-8 text-center">
                {t("voting:create.steps.questions.loadError")}
            </div>
        );
    }

    const vote = voteQuery.data as VoteDetailResponseDto;
    const questions = vote.questions ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-blue-100/50 bg-blue-50/50 px-4 py-2">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    {isMutating > 0 ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>
                                {t("voting:create.steps.questions.saving")}
                            </span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="text-muted-foreground font-normal">
                                {t("voting:create.steps.questions.autoSave")}
                            </span>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">
                        {t("voting:create.steps.questions.title")}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        {t("voting:create.steps.questions.description")}
                    </p>
                </div>
                <Button
                    onClick={handleAddQuestion}
                    disabled={createQuestionMutation.isPending}
                    size="sm"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("voting:create.steps.questions.addQuestion")}
                </Button>
            </div>

            <QuestionsList vote={vote} onRefresh={() => voteQuery.refetch()} />

            {questions.length === 0 && (
                <div className="text-muted-foreground rounded-lg border-2 border-dashed p-12 text-center">
                    {t("voting:create.steps.questions.emptyState")}
                </div>
            )}

            <div className="border-t pt-6">
                <div className="flex justify-end">
                    <Button
                        onClick={() => navigate(`/voting/${vote.id}`)}
                        className="bg-emerald-600 hover:bg-emerald-700 h-11 px-8 text-lg"
                    >
                        <Flag className="mr-2 h-5 w-5" />
                        {t("voting:create.actions.finish")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
