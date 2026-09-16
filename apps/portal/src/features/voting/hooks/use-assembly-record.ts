import { useQueryClient } from "@tanstack/react-query";

import { showApiError } from "@/api/error-utils";
import type { AssemblyRecordResponseDto } from "@/api/generated/model";
import {
    getVotesControllerGetAssemblyRecordQueryKey,
    useVotesControllerDeleteAssemblyBallot,
    useVotesControllerGetAssemblyRecord,
    useVotesControllerPublishAssemblyRecord,
    useVotesControllerRecordAssemblyBallot,
    useVotesControllerSetUnitAttendance,
} from "@/api/generated/votes/votes";

/**
 * The recording session's data layer.
 *
 * There is no save button: every change is written immediately and the record
 * is refetched, so the roster, the attendance card and the running count all
 * follow from one server-side source of truth rather than from local state
 * that could drift from it.
 */
export function useAssemblyRecord(voteId: string) {
    const queryClient = useQueryClient();
    const queryKey = getVotesControllerGetAssemblyRecordQueryKey(voteId);

    const query = useVotesControllerGetAssemblyRecord(voteId, {
        query: { enabled: !!voteId },
    });

    const refetch = () => queryClient.invalidateQueries({ queryKey });
    const mutationOptions = {
        mutation: { onSuccess: refetch, onError: showApiError },
    };

    const setAttendance = useVotesControllerSetUnitAttendance(mutationOptions);
    const recordBallot = useVotesControllerRecordAssemblyBallot(mutationOptions);
    const deleteBallot = useVotesControllerDeleteAssemblyBallot(mutationOptions);
    const publish = useVotesControllerPublishAssemblyRecord({
        mutation: { onError: showApiError },
    });

    return {
        record: query.data as AssemblyRecordResponseDto | undefined,
        isLoading: query.isLoading,
        isError: query.isError,
        refetch,

        markPresent: (
            unitId: string,
            voter: { ownerId: string | null; note: string | null },
        ) =>
            setAttendance.mutateAsync({
                id: voteId,
                unitId,
                data: {
                    status: "PRESENT",
                    voterOwnerId: voter.ownerId,
                    voterNote: voter.note,
                },
            }),

        // The server clears the voter and drops the unit's ballot; nothing to
        // undo here beyond letting the refetch land.
        markAbsent: (unitId: string) =>
            setAttendance.mutateAsync({
                id: voteId,
                unitId,
                data: { status: "ABSENT" },
            }),

        answer: (
            unitId: string,
            answers: { questionId: string; optionId: string }[],
        ) =>
            recordBallot.mutateAsync({
                id: voteId,
                unitId,
                data: { answers },
            }),

        clearAnswers: (unitId: string) =>
            deleteBallot.mutateAsync({ id: voteId, unitId }),

        publish: () => publish.mutateAsync({ id: voteId }),

        isSaving:
            setAttendance.isPending ||
            recordBallot.isPending ||
            deleteBallot.isPending,
        isPublishing: publish.isPending,
    };
}
