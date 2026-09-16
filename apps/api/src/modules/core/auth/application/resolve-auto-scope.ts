import {
  TenantMembership,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';

/**
 * The single association a token may be scoped to without the user choosing.
 *
 * Shared by login and refresh so the two cannot drift: login used to filter by
 * status before counting while refresh counted every membership, so a user
 * holding one active membership and one pending invitation was scoped when
 * they signed in and then silently lost that scope on the first refresh.
 *
 * Returns null when nothing is active, or when more than one is — the user
 * picks in that case.
 */
export function resolveAutoScope(
  memberships: TenantMembership[],
): TenantMembership | null {
  const active = memberships.filter(
    (m) => m.status === TenantMembershipStatus.ACTIVE,
  );
  return active.length === 1 ? active[0]! : null;
}
