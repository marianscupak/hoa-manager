import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Button, ConfirmDialog, toast } from "@hoa-mngr/ui";

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
        <>
            <Button
                type="button"
                variant="outline"
                size={triggerSize}
                className={`text-destructive hover:text-destructive hover:bg-destructive/5 ${triggerClassName ?? ""}`}
                onClick={() => setIsOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("voting:detail.actions.delete")}
            </Button>
            <ConfirmDialog
                open={isOpen}
                onOpenChange={setIsOpen}
                title={t("voting:detail.actions.deleteConfirmTitle")}
                description={t(
                    "voting:detail.actions.deleteConfirmDescription",
                )}
                confirmLabel={t("voting:detail.actions.deleteConfirm")}
                cancelLabel={t("voting:detail.actions.cancel")}
                confirming={deleteMutation.isPending}
                onConfirm={handleDelete}
            />
        </>
    );
}
