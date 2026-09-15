import axios from "axios";
import { useCallback, useRef, useState } from "react";

import { showApiError } from "@/api/error-utils";
import {
    votesControllerDeleteBallotAttachment,
    votesControllerRequestBallotAttachmentUpload,
} from "@/api/generated/votes/votes";

export interface BallotAttachment {
    documentId: string;
    fileName: string;
    sizeBytes: number;
}

export const BALLOT_SCAN_MAX_SIZE_BYTES = 20 * 1024 * 1024;
export const BALLOT_SCAN_ACCEPT = "application/pdf,image/png,image/jpeg";

export function useBallotAttachment(voteId: string) {
    const [attachment, setAttachment] = useState<BallotAttachment | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    // Bumped on every upload() start and every remove(). A PUT that resolves
    // (or rejects) after the flow has moved on — Back, a rail jump, or Exit,
    // all mid-upload — carries a stale token and must not attach itself to
    // whatever unit is current now, nor touch that unit's own upload state.
    const tokenRef = useRef(0);

    const upload = useCallback(
        async (file: File) => {
            const token = ++tokenRef.current;
            setIsUploading(true);
            setProgress(0);
            try {
                const { documentId, uploadUrl } =
                    await votesControllerRequestBallotAttachmentUpload(voteId, {
                        fileName: file.name,
                        contentType: file.type,
                        sizeBytes: file.size,
                    });

                // Bare axios on purpose: the shared API instance would attach
                // the Bearer token, which must never be sent to R2.
                await axios.put(uploadUrl, file, {
                    headers: { "Content-Type": file.type },
                    onUploadProgress: (e) =>
                        setProgress(
                            e.total
                                ? Math.round((e.loaded / e.total) * 100)
                                : 0,
                        ),
                });

                if (token !== tokenRef.current) {
                    // The flow moved to a different unit while this upload
                    // was in flight — don't attach it here, and don't leave
                    // the row for the 24h cleanup cron.
                    votesControllerDeleteBallotAttachment(
                        voteId,
                        documentId,
                    ).catch(() => {
                        // Best-effort: the cleanup cron still reaps it.
                    });
                    return;
                }

                setAttachment({
                    documentId,
                    fileName: file.name,
                    sizeBytes: file.size,
                });
            } catch (error) {
                if (token === tokenRef.current) showApiError(error);
            } finally {
                if (token === tokenRef.current) setIsUploading(false);
            }
        },
        [voteId],
    );

    const remove = useCallback(async () => {
        tokenRef.current++;
        setIsUploading(false);
        setProgress(0);
        if (!attachment) return;
        const { documentId } = attachment;
        setAttachment(null);
        try {
            await votesControllerDeleteBallotAttachment(voteId, documentId);
        } catch {
            // The row is unlinked client-side and the cleanup cron reaps the
            // R2 object; a delete failure here isn't actionable for the
            // admin, so it's deliberately swallowed — no error toast.
        }
    }, [attachment, voteId]);

    // State-only reset, no DELETE call. Once a ballot has been recorded, the
    // attachment is the permanent evidence for that recording, not an
    // orphaned upload — remove() would delete it from R2. Use this after a
    // successful record to clear local state without touching the document.
    const clear = useCallback(() => {
        tokenRef.current++;
        setIsUploading(false);
        setProgress(0);
        setAttachment(null);
    }, []);

    return { attachment, isUploading, progress, upload, remove, clear };
}
