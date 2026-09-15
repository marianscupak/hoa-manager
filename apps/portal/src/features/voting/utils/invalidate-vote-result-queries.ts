import type { QueryClient } from "@tanstack/react-query";

import {
    getVotesControllerGetVoteParticipationQueryKey,
    getVotesControllerGetVoteTallyQueryKey,
    getVotesControllerGetVoteTurnoutQueryKey,
} from "@/api/generated/votes/votes";

/**
 * Everything the live results view reads about who has voted. A ballot —
 * cast in the app or recorded from paper — moves all three at once, so they
 * are invalidated together rather than at each call site: the tally is the
 * one that gets forgotten, and a stale tally contradicts the unit list
 * sitting directly above it on the same screen.
 *
 * Safe to call for any role. React Query only refetches active queries, so
 * for a unit owner — who never mounts the board-only tally — that key is
 * merely marked stale and no request is made.
 */
export function invalidateVoteResultQueries(
    queryClient: QueryClient,
    voteId: string,
): void {
    for (const queryKey of [
        getVotesControllerGetVoteParticipationQueryKey(voteId),
        getVotesControllerGetVoteTurnoutQueryKey(voteId),
        getVotesControllerGetVoteTallyQueryKey(voteId),
    ]) {
        void queryClient.invalidateQueries({ queryKey });
    }
}
