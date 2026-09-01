import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, EmptyState, ErrorState } from "@hoa-mngr/ui";

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
    onSavingChange?: (saving: boolean) => void;
}

export function CreateVoteQuestionsStep({
    voteId,
    onSavingChange,
}: CreateVoteQuestionsStepProps) {
    const { t } = useTranslation(["voting", "common"]);

    const voteQuery = useVotesControllerGetVoteDetail(voteId ?? "", {
        query: { enabled: !!voteId },
    });

    const createQuestionMutation = useVotesControllerCreateVoteQuestion();

    const [autoOpenId, setAutoOpenId] = useState<string | null>(null);

    const { isPending } = createQuestionMutation;

    useEffect(() => {
        onSavingChange?.(isPending);
        return () => onSavingChange?.(false);
    }, [isPending, onSavingChange]);

    const handleAddQuestion = () => {
        if (!voteId) return;

        createQuestionMutation.mutate(
            {
                id: voteId,
                data: {
                    title: t("create.steps.questions.defaultTitle"),
                    type: CreateVoteQuestionDtoType.YES_NO,
                },
            },
            {
                // TODO: check why this is not typed correctly
                onSuccess: (data: any) => {
                    if (data?.id) {
                        setAutoOpenId(data.id);
                    } else {
                        setAutoOpenId("NEWLY_CREATED_FALLBACK");
                    }
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
            <ErrorState
                message={t("create.steps.questions.loadError")}
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => voteQuery.refetch()}
                    >
                        {t("common:retry")}
                    </Button>
                }
            />
        );
    }

    const vote = voteQuery.data as VoteDetailResponseDto;
    const questions = vote.questions ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl font-extrabold tracking-tight">
                        {t("create.steps.questions.title")}
                    </h1>
                    <p className="text-muted-foreground mt-1.5 text-sm">
                        {t("create.steps.questions.description")}
                    </p>
                </div>
                <Button
                    onClick={handleAddQuestion}
                    disabled={createQuestionMutation.isPending}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("create.steps.questions.addQuestion")}
                </Button>
            </div>

            <QuestionsList
                vote={vote}
                onRefresh={() => voteQuery.refetch()}
                autoOpenId={autoOpenId}
            />

            {questions.length === 0 && (
                <EmptyState message={t("create.steps.questions.emptyState")} />
            )}
        </div>
    );
}
