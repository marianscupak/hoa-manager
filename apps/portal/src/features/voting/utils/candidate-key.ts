/**
 * One stable key per person in the delegation UIs. A representative is a
 * person, stored as the owner whenever they own in the tenant (they may have
 * no account), else as their membership. The key travels through form state
 * and comes back as the request body's target.
 */
export function candidateKey(c: {
    ownerId: string | null;
    membershipId: string | null;
}): string {
    if (c.ownerId) return `owner:${c.ownerId}`;
    return `member:${c.membershipId ?? ""}`;
}

export function consentTargetFromKey(key: string): {
    toOwnerId?: string;
    toMembershipId?: string;
} {
    const [kind, id] = key.split(":", 2);
    return kind === "owner" ? { toOwnerId: id } : { toMembershipId: id };
}
