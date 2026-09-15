/**
 * Custom hook for submitting ballots.
 * This will be replaced by the generated Orval hook after running `pnpm generate`.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    getVotesControllerGetVoterStatusQueryKey,
    getVotesControllerGetVotesQueryKey,
} from "@/api/generated/votes/votes";
import { customInstance } from "@/api/axios";

import { invalidateVoteResultQueries } from "../utils/invalidate-vote-result-queries";

export interface SubmitBallotAnswer {
    questionId: string;
    optionId: string;
}

export interface SubmitBallotUnit {
    unitId: string;
    answers: SubmitBallotAnswer[];
}

export interface SubmitBallotBody {
    ballots: SubmitBallotUnit[];
}

export interface SubmitBallotResponse {
    submittedAt: string;
}

const submitBallot = (voteId: string, data: SubmitBallotBody) => {
    return customInstance<SubmitBallotResponse>({
        url: `/api/votes/${voteId}/ballots`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data,
    });
};

export function useSubmitBallot(voteId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SubmitBallotBody) => submitBallot(voteId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: getVotesControllerGetVoterStatusQueryKey(voteId),
            });
            void queryClient.invalidateQueries({
                queryKey: getVotesControllerGetVotesQueryKey(),
            });
            // The voter has just changed the live standings, so the results
            // view must not still show their unit as not voted when they
            // open it.
            invalidateVoteResultQueries(queryClient, voteId);
        },
    });
}
