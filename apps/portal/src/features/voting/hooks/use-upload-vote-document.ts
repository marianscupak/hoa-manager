import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRef, useState } from "react";

import { showApiError } from "@/api/error-utils";
import {
    getVotesControllerGetVoteDetailQueryKey,
    votesControllerConfirmDocumentUpload,
    votesControllerRequestDocumentUpload,
} from "@/api/generated/votes/votes";

export interface UploadState {
    file: File;
    progress: number; // 0..100
    status: "queued" | "uploading" | "error";
}

export function useUploadVoteDocument(voteId: string | null) {
    const queryClient = useQueryClient();
    const [uploads, setUploads] = useState<Record<string, UploadState>>({});
    // Synchronous mirror of `uploads`: flushAndSettle must decide whether the
    // wizard may advance right after the last promise settles, before React
    // has re-rendered.
    const uploadsRef = useRef<Record<string, UploadState>>({});
    // In-flight uploads, so settling also awaits retries started mid-flight.
    const pendingRef = useRef(new Map<string, Promise<boolean>>());

    const applyUploads = (
        updater: (
            current: Record<string, UploadState>,
        ) => Record<string, UploadState>,
    ) => {
        uploadsRef.current = updater(uploadsRef.current);
        setUploads(uploadsRef.current);
    };

    const setUpload = (key: string, patch: Partial<UploadState>) =>
        applyUploads((u) => ({ ...u, [key]: { ...u[key], ...patch } }));

    const removeUpload = (key: string) =>
        applyUploads((u) => {
            const next = { ...u };
            delete next[key];
            return next;
        });

    const startUpload = async (
        key: string,
        file: File,
        targetVoteId: string,
    ): Promise<boolean> => {
        try {
            const { documentId, uploadUrl } =
                await votesControllerRequestDocumentUpload(targetVoteId, {
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

            await votesControllerConfirmDocumentUpload(
                targetVoteId,
                documentId,
            );
            await queryClient.invalidateQueries({
                queryKey: getVotesControllerGetVoteDetailQueryKey(targetVoteId),
            });
            removeUpload(key);
            return true;
        } catch (error) {
            setUpload(key, { status: "error" });
            showApiError(error);
            return false;
        }
    };

    const track = (key: string, file: File, targetVoteId: string) => {
        const promise = startUpload(key, file, targetVoteId).finally(() =>
            pendingRef.current.delete(key),
        );
        pendingRef.current.set(key, promise);
    };

    const addFile = (file: File) => {
        const key = `${file.name}-${Date.now()}-${Math.random()}`;
        if (voteId) {
            applyUploads((u) => ({
                ...u,
                [key]: { file, progress: 0, status: "uploading" },
            }));
            track(key, file, voteId);
        } else {
            // No draft vote yet — hold the file until flushAndSettle runs
            // after the details step saves.
            applyUploads((u) => ({
                ...u,
                [key]: { file, progress: 0, status: "queued" },
            }));
        }
    };

    /**
     * Starts every queued upload against the (just created) vote and resolves
     * once nothing is in flight any more — including retries started while
     * settling. Resolves true when no rows remain (everything uploaded or was
     * dismissed), false when error rows are left behind.
     */
    const flushAndSettle = async (targetVoteId: string): Promise<boolean> => {
        for (const [key, u] of Object.entries(uploadsRef.current)) {
            if (u.status !== "queued") continue;
            setUpload(key, { status: "uploading", progress: 0 });
            track(key, u.file, targetVoteId);
        }
        while (pendingRef.current.size > 0) {
            await Promise.all([...pendingRef.current.values()]);
        }
        return Object.keys(uploadsRef.current).length === 0;
    };

    return { addFile, flushAndSettle, uploads, dismiss: removeUpload };
}
