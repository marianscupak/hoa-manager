/**
 * Read-side metrics for owners used by the property overview endpoint.
 *
 * "Active" matches the same predicate the owner listing handler uses to
 * decide an owner is not in a pending-invite state: an owner is active
 * when they either have a `userId` linked, or no email at all, or no
 * outstanding (non-accepted, non-expired) invite. Equivalently:
 * NOT (userId IS NULL AND email IS NOT NULL AND a non-accepted,
 * non-expired invite exists for the owner).
 */
export interface OwnerReadRepository {
  countActive(tenantId: string, now: Date): Promise<number>;
}

export const OWNER_READ_REPOSITORY = Symbol('OWNER_READ_REPOSITORY');
