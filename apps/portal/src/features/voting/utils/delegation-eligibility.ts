import type {
    ConsentPreviewResponseDto,
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

/**
 * Whether the member may hand this unit to someone else. Only their own units
 * qualify — a PROXY unit is one they already hold on an owner's behalf, and a
 * unit that has voted, is already delegated or is ineligible has nothing left
 * to pass on.
 */
export function isDelegableUnit(unit: OwningUnitStatusDto): boolean {
    return unit.status === "REQUIRES_DELEGATION" || unit.status === "READY";
}

/** Votes an admin may record a paper power of attorney against. */
export function votesOpenForDelegation(
    votes: VoteListItemResponseDto[] | undefined,
): VoteListItemResponseDto[] {
    return votes?.filter((v) => v.status === "SCHEDULED") ?? [];
}

/**
 * The votes the member can start a delegation on right now: scheduled ones
 * where they still hold a unit of their own to hand over.
 *
 * `owningUnitsByVoteId` carries the voter status already fetched per vote; a
 * vote missing from it (still loading, or failed) is left out rather than
 * offered on a guess — the delegation screen it leads to selects units with
 * the same `isDelegableUnit` predicate, so an entry here always has something
 * to choose there.
 */
export function votesDelegableByMember(
    votes: VoteListItemResponseDto[] | undefined,
    owningUnitsByVoteId: Map<string, OwningUnitStatusDto[]>,
): VoteListItemResponseDto[] {
    return votesOpenForDelegation(votes).filter((vote) =>
        (owningUnitsByVoteId.get(vote.id) ?? []).some(isDelegableUnit),
    );
}

export type ConsentRisk = "noRepresentative";

/**
 * Whether the delegation flow should warn about what a consent does to the
 * unit, given the server's preview of the outcome.
 *
 * `"noRepresentative"` covers the case members do not expect: a consent can
 * take a unit's representative away rather than move it. A spouse designated
 * by the other spouse holds the unit only while they back themselves, so
 * passing it on drops the unit to nobody until the other spouse names the same
 * person too.
 *
 * A preview in hand describes the selection it was fetched for, so while a
 * fresh one is in flight there is nothing trustworthy to say yet.
 */
export function consentRisk(
    preview: ConsentPreviewResponseDto | undefined,
    isPreviewPending: boolean,
): ConsentRisk | null {
    if (isPreviewPending || !preview) return null;
    return preview.wouldLeaveUnitWithoutRepresentative
        ? "noRepresentative"
        : null;
}
