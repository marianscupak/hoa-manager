/**
 * Aggregated pending-invite metrics for the property overview endpoint.
 *
 * "Pending" matches the existing `ListOwnersHandler` definition:
 * an invite row that has `accepted_at IS NULL` and `expires_at > now()`.
 * Expired-but-not-accepted invites are excluded — they surface as
 * `inviteStatus = 'expired'` in the owner listing, not as pending.
 */
export interface PendingInviteSummary {
  pending: number;
  oldestPendingCreatedAt: Date | null;
}

export interface InviteReadRepository {
  getPendingSummary(tenantId: string, now: Date): Promise<PendingInviteSummary>;
}

export const INVITE_READ_REPOSITORY = Symbol('INVITE_READ_REPOSITORY');
