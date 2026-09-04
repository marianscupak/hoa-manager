import type {
    OwningUnitStatusDto,
    VoteListItemResponseDto,
} from "@/api/generated/model";

export type DelegationPrompt = "required" | "available";

/**
 * Which delegation call-to-action, if any, the voter-status sidebar should
 * show. Consents can only be recorded while a vote is SCHEDULED (the API
 * rejects every other status and the electorate is frozen at open), so
 * nothing is offered outside that window.
 *
 * - `"required"`: a co-owned unit has no common representative yet and will
 *   be ineligible unless one is agreed.
 * - `"available"`: the member can vote in person but may still appoint a
 *   proxy, e.g. because they will be away. Only their own READY units count —
 *   a unit they hold for someone else is not theirs to pass on.
 */
export function delegationPrompt(
    voteStatus: string,
    owningUnits: OwningUnitStatusDto[],
): DelegationPrompt | null {
    if (voteStatus !== "SCHEDULED") return null;
    if (owningUnits.some((u) => u.status === "REQUIRES_DELEGATION")) {
        return "required";
    }
    if (owningUnits.some((u) => u.status === "READY")) return "available";
    return null;
}

/** Votes an admin may record a paper power of attorney against. */
export function votesOpenForDelegation(
    votes: VoteListItemResponseDto[] | undefined,
): VoteListItemResponseDto[] {
    return votes?.filter((v) => v.status === "SCHEDULED") ?? [];
}
