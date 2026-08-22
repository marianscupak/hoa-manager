import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";

import { showApiError } from "@/api/error-utils";
import {
    getVotesControllerGetVoteDetailQueryKey,
    votesControllerConfirmDocumentUpload,
    votesControllerRequestDocumentUpload,
} from "@/api/generated/votes/votes";

export interface UploadState {
    file: File;
    progress: number; // 0..100
    status: "uploading" | "error";
}

export function useUploadVoteDocument(voteId: string) {
    const queryClient = useQueryClient();
    const [uploads, setUploads] = useState<Record<string, UploadState>>({});

    const setUpload = (key: string, patch: Partial<UploadState>) =>
        setUploads((u) => ({ ...u, [key]: { ...u[key], ...patch } }));

    const removeUpload = (key: string) =>
        setUploads((u) => {
            const next = { ...u };
            delete next[key];
            return next;
        });

    const upload = async (file: File) => {
        const key = `${file.name}-${Date.now()}-${Math.random()}`;
        setUploads((u) => ({
            ...u,
            [key]: { file, progress: 0, status: "uploading" },
        }));
        try {
            const { documentId, uploadUrl } =
                await votesControllerRequestDocumentUpload(voteId, {
                    fileName: file.name,
                    contentType: file.type,
                    sizeBytes: file.size,
                });

            // Bare axios on purpose: the shared API instance would attach the
            // Bearer token, which must never be sent to R2.
            await axios.put(uploadUrl, file, {
                headers: { "Content-Type": file.type },
                onUploadProgress: (e) => {
                    const progress = e.total
                        ? Math.round((e.loaded / e.total) * 100)
                        : 0;
                    setUpload(key, { progress });
                },
            });

            await votesControllerConfirmDocumentUpload(voteId, documentId);
            await queryClient.invalidateQueries({
                queryKey: getVotesControllerGetVoteDetailQueryKey(voteId),
            });
            removeUpload(key);
        } catch (error) {
            setUpload(key, { status: "error" });
            showApiError(error);
        }
    };

    return { upload, uploads, dismiss: removeUpload };
}
