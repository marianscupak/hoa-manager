import { useQueryClient } from "@tanstack/react-query";
import { File, Loader2, Plus, X } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@hoa-mngr/ui";

import { showApiError } from "@/api/error-utils";
import { VoteDocumentResponseDto } from "@/api/generated/model";
import {
    getVotesControllerGetVoteDetailQueryKey,
    useVotesControllerDeleteVoteDocument,
} from "@/api/generated/votes/votes";

import {
    VOTE_DOCUMENT_ACCEPT_ATTRIBUTE,
    VOTE_DOCUMENT_ALLOWED_CONTENT_TYPES,
    VOTE_DOCUMENT_MAX_COUNT,
    VOTE_DOCUMENT_MAX_SIZE_BYTES,
} from "../constants/vote-documents";
import { UploadState } from "../hooks/use-upload-vote-document";
import { formatFileSize } from "../utils/format-file-size";

export interface VoteDocumentsSectionProps {
    /** Null while the draft vote does not exist yet — files queue instead. */
    voteId: string | null;
    documents: VoteDocumentResponseDto[];
    uploads: Record<string, UploadState>;
    addFile: (file: File) => void;
    dismiss: (key: string) => void;
}

export function VoteDocumentsSection({
    voteId,
    documents,
    uploads,
    addFile,
    dismiss,
}: VoteDocumentsSectionProps) {
    const { t } = useTranslation(["voting"]);
    const queryClient = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);
    const deleteMutation = useVotesControllerDeleteVoteDocument();

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        // Tracked locally (not derived from render-scope state) so a single
        // multi-select batch enforces the cap across the files it contains.
        let projectedCount = documents.length + Object.keys(uploads).length;
        for (const file of Array.from(files)) {
            if (!VOTE_DOCUMENT_ALLOWED_CONTENT_TYPES.includes(file.type)) {
                toast.error(t("voting:create.documents.typeNotAllowed"));
                continue;
            }
            if (file.size > VOTE_DOCUMENT_MAX_SIZE_BYTES) {
                toast.error(t("voting:create.documents.tooLarge"));
                continue;
            }
            if (projectedCount >= VOTE_DOCUMENT_MAX_COUNT) {
                toast.error(t("voting:create.documents.limitReached"));
                break;
            }
            projectedCount += 1;
            addFile(file);
        }
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleDelete = (documentId: string) => {
        if (!voteId) return;
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

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold">
                        {t("voting:create.documents.title")}
                    </h2>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        {t("voting:create.documents.description")}
                    </p>
                    {!voteId && (
                        <p className="text-muted-foreground mt-0.5 text-xs">
                            {t("voting:create.documents.queuedHint")}
                        </p>
                    )}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                >
                    <Plus />
                    {t("voting:create.documents.add")}
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={VOTE_DOCUMENT_ACCEPT_ATTRIBUTE}
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            <div className="flex flex-col gap-2">
                {documents.map((doc) => (
                    <div
                        key={doc.id}
                        className="rounded-panel border-hairline flex items-center justify-between gap-3 border p-3"
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <File className="text-muted-foreground h-4 w-4 shrink-0" />
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
                                aria-label={t("voting:detail.documents.delete")}
                                disabled={deleteMutation.isPending}
                                onClick={() => handleDelete(doc.id)}
                                className="text-muted-foreground hover:text-destructive shrink-0"
                            >
                                <X />
                            </Button>
                        </div>
                    </div>
                ))}

                {Object.entries(uploads).map(([key, u]) => (
                    <div
                        key={key}
                        className="rounded-panel border-hairline flex flex-col gap-2 border p-3"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                {u.status === "uploading" ? (
                                    <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
                                ) : u.status === "error" ? (
                                    <File className="text-destructive h-4 w-4 shrink-0" />
                                ) : (
                                    <File className="text-muted-foreground h-4 w-4 shrink-0" />
                                )}
                                <span className="truncate text-sm font-medium">
                                    {u.file.name}
                                </span>
                            </div>
                            {u.status === "error" ? (
                                <div className="flex shrink-0 items-center gap-2">
                                    <span className="text-destructive text-xs">
                                        {t(
                                            "voting:create.documents.uploadFailed",
                                        )}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            dismiss(key);
                                            addFile(u.file);
                                        }}
                                        className="focus-visible:ring-ring cursor-pointer rounded-sm text-xs font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                    >
                                        {t("voting:create.documents.retry")}
                                    </button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="tableIcon"
                                        aria-label={t(
                                            "voting:create.documents.dismiss",
                                        )}
                                        onClick={() => dismiss(key)}
                                        className="text-muted-foreground hover:text-foreground shrink-0"
                                    >
                                        <X />
                                    </Button>
                                </div>
                            ) : u.status === "queued" ? (
                                <div className="flex shrink-0 items-center gap-2">
                                    <span className="text-muted-foreground text-xs">
                                        {t("voting:create.documents.queued")}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="tableIcon"
                                        aria-label={t(
                                            "voting:create.documents.dismiss",
                                        )}
                                        onClick={() => dismiss(key)}
                                        className="text-muted-foreground hover:text-foreground shrink-0"
                                    >
                                        <X />
                                    </Button>
                                </div>
                            ) : (
                                <span className="text-muted-foreground shrink-0 text-xs">
                                    {t("voting:create.documents.uploading")}
                                </span>
                            )}
                        </div>
                        {u.status === "uploading" && (
                            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                                <div
                                    className="bg-primary h-full transition-all"
                                    style={{ width: `${u.progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
