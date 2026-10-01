import { resolveAutoScope } from '@/modules/core/auth/application/resolve-auto-scope';
import { TenantMembership } from '@/modules/core/tenancy/domain/tenant.entity';
import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/shared/domain/membership';

function membership(
  id: string,
  status: TenantMembershipStatus,
): TenantMembership {
  return {
    id,
    tenantId: `tenant-${id}`,
    userId: 'user-1',
    role: TenantMembershipRole.UNIT_OWNER,
    status,
  } as TenantMembership;
}

const ACTIVE = TenantMembershipStatus.ACTIVE;
const INVITED = TenantMembershipStatus.INVITED;
const SUSPENDED = TenantMembershipStatus.SUSPENDED;

describe('resolveAutoScope', () => {
  it('scopes to the only active membership', () => {
    const only = membership('a', ACTIVE);

    expect(resolveAutoScope([only])).toBe(only);
  });

  it('ignores a pending invitation when picking the only active one', () => {
    // The divergence this function exists to remove: login filtered by status
    // before counting, refresh counted every membership. A user with one
    // active membership and one pending invitation was scoped on login and
    // then silently lost that scope the first time their token refreshed.
    const active = membership('a', ACTIVE);

    expect(resolveAutoScope([active, membership('b', INVITED)])).toBe(active);
  });

  it('refuses to guess between two active memberships', () => {
    expect(
      resolveAutoScope([membership('a', ACTIVE), membership('b', ACTIVE)]),
    ).toBeNull();
  });

  it('returns nothing when no membership is active', () => {
    expect(resolveAutoScope([membership('a', SUSPENDED)])).toBeNull();
    expect(resolveAutoScope([membership('a', INVITED)])).toBeNull();
    expect(resolveAutoScope([])).toBeNull();
  });
});
