import { useQueryClient } from "@tanstack/react-query";
import { Download, File, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import { VoteDocumentResponseDto } from "@/api/generated/model";
import {
    getVotesControllerGetVoteDetailQueryKey,
    useVotesControllerDeleteVoteDocument,
    votesControllerGetDocumentDownloadUrl,
} from "@/api/generated/votes/votes";

import { formatFileSize } from "../utils/format-file-size";

export interface VoteDocumentsProps {
    voteId: string;
    documents: VoteDocumentResponseDto[];
    /** Show the remove button (admin/board viewing a DRAFT vote). */
    canManage?: boolean;
}

export function VoteDocuments({
    voteId,
    documents,
    canManage = false,
}: VoteDocumentsProps) {
    const { t } = useTranslation("voting");
    const queryClient = useQueryClient();
    const deleteMutation = useVotesControllerDeleteVoteDocument();

    const handleDownload = async (documentId: string) => {
        try {
            const { downloadUrl } = await votesControllerGetDocumentDownloadUrl(
                voteId,
                documentId,
            );
            const anchor = document.createElement("a");
            anchor.href = downloadUrl;
            anchor.rel = "noopener";
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
        } catch (error) {
            showApiError(error);
        }
    };

    const handleDelete = (documentId: string) => {
        deleteMutation.mutate(
            { id: voteId, documentId },
            {
                onSuccess: () =>
                    queryClient.invalidateQueries({
                        queryKey:
                            getVotesControllerGetVoteDetailQueryKey(voteId),
                    }),
                onError: showApiError,
            },
        );
    };

    if (documents.length === 0) {
        return (
            <p className="text-muted-foreground text-sm">
                {t("detail.documents.empty")}
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {documents.map((doc) => (
                <div
                    key={doc.id}
                    className="rounded-panel border-hairline hover:bg-muted flex items-center justify-between gap-3 border p-3 transition-colors"
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="bg-destructive-muted text-destructive-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                            <File className="h-4 w-4" />
                        </div>
                        <span className="truncate text-sm font-medium">
                            {doc.fileName}
                        </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        <span className="text-muted-foreground text-xs">
                            {formatFileSize(doc.sizeBytes)}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="tableIcon"
                            aria-label={t("detail.documents.download")}
                            onClick={() => void handleDownload(doc.id)}
                            className="text-muted-foreground hover:text-foreground shrink-0"
                        >
                            <Download />
                        </Button>
                        {canManage && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="tableIcon"
                                aria-label={t("detail.documents.delete")}
                                disabled={deleteMutation.isPending}
                                onClick={() => handleDelete(doc.id)}
                                className="text-muted-foreground hover:text-destructive shrink-0"
                            >
                                <X />
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
