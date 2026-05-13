import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

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

import { showApiError } from "@/api/error-utils";
import {
    getVotesControllerGetVotesQueryKey,
    useVotesControllerDeleteVote,
} from "@/api/generated/votes/votes";

interface DeleteDraftVoteDialogProps {
    voteId: string;
    triggerSize?: "sm" | "default";
    triggerClassName?: string;
}

export function DeleteDraftVoteDialog({
    voteId,
    triggerSize = "sm",
    triggerClassName,
}: DeleteDraftVoteDialogProps) {
    const { t } = useTranslation(["voting"]);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    const deleteMutation = useVotesControllerDeleteVote();

    const handleDelete = () => {
        deleteMutation.mutate(
            { id: voteId },
            {
                onSuccess: () => {
                    toast.success(t("voting:detail.actions.deleteSuccess"));
                    queryClient.invalidateQueries({
                        queryKey: getVotesControllerGetVotesQueryKey(),
                    });
                    setIsOpen(false);
                    navigate("/voting");
                },
                onError: showApiError,
            },
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size={triggerSize}
                    className={`text-destructive hover:text-destructive hover:bg-destructive/5 ${triggerClassName ?? ""}`}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("voting:detail.actions.delete")}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t("voting:detail.actions.deleteConfirmTitle")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("voting:detail.actions.deleteConfirmDescription")}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={deleteMutation.isPending}
                    >
                        {t("voting:detail.actions.cancel")}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {t("voting:detail.actions.deleteConfirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
