import { useAtomValue } from "jotai";
import { BarChart2, Edit2, Loader2, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@hoa-mngr/ui";

import { useVotesControllerGetVoteDetail } from "@/api/generated/votes/votes";
import { tenantContextAtom } from "@/auth/atoms";

import { DeleteDraftVoteDialog } from "../components/delete-draft-vote-dialog";
import { ScheduleValidationModal } from "../components/schedule-validation-modal";
import { StatusBadge } from "../components/status-badge";
import { VoteDetailTimeline } from "../components/vote-detail-timeline";
import { VoteDocuments } from "../components/vote-documents";
import { VoteQuestionsList } from "../components/vote-questions-list";
import { VoterStatusSidebar } from "../components/voter-status-sidebar";
import { useScheduleVote } from "../hooks/use-schedule-vote";

export function VoteDetailPage() {
    const { t } = useTranslation(["voting"]);
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const tenantCtx = useAtomValue(tenantContextAtom);

    const isAdmin =
        tenantCtx?.roles.includes("ADMIN") ||
        tenantCtx?.roles.includes("BOARD_MEMBER");

    const voteQuery = useVotesControllerGetVoteDetail(id ?? "", {
        query: {
            enabled: !!id,
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
    } = useScheduleVote(id ?? "", {
        onSuccess: () => {
            voteQuery.refetch();
        },
    });

    const handleEdit = () => {
        navigate(`/voting/${id}/edit`);
    };

    if (voteQuery.isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (voteQuery.isError || !voteQuery.data) {
        return (
            <div className="text-destructive p-8 text-center">
                {t("voting:list.error")}
            </div>
        );
    }

    const vote = voteQuery.data;

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <h1 className="text-3xl font-bold">{vote.title}</h1>
                    <StatusBadge status={vote.status} />
                </div>

                {isAdmin && vote.status === "DRAFT" && (
                    <div className="flex gap-3">
                        <DeleteDraftVoteDialog voteId={vote.id} />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEdit}
                        >
                            <Edit2 className="mr-2 h-4 w-4" />
                            {t("voting:detail.actions.edit")}
                        </Button>
                        <Dialog
                            open={isConfirmOpen}
                            onOpenChange={setIsConfirmOpen}
                        >
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Send className="mr-2 h-4 w-4" />
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

                {vote.status === "CLOSED" && (
                    <Button
                        size="sm"
                        onClick={() => navigate(`/voting/${id}/results`)}
                    >
                        <BarChart2 className="mr-2 h-4 w-4" />
                        {t("voting:results.viewResults")}
                    </Button>
                )}
            </div>

            <ScheduleValidationModal
                open={isValidationOpen}
                onOpenChange={setIsValidationOpen}
                errors={validationErrors}
                voteId={id ?? ""}
                isAlreadyOnEditPage={false}
            />

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <VoteDetailTimeline
                        scheduledFrom={vote.scheduledFrom ?? null}
                        scheduledTo={vote.scheduledTo ?? null}
                    />

                    {vote.description && (
                        <div className="mb-10">
                            <h2 className="mb-4 text-xl font-bold">
                                {t("voting:detail.description.title")}
                            </h2>
                            <div className="leading-relaxed whitespace-pre-wrap text-slate-600">
                                {vote.description}
                            </div>
                        </div>
                    )}

                    <VoteDocuments />

                    <VoteQuestionsList questions={vote.questions} />
                </div>

                <div>
                    <VoterStatusSidebar />
                </div>
            </div>
        </div>
    );
}
