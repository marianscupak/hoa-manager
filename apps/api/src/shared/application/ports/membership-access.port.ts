import type {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/shared/domain/membership';

export interface MembershipAccess {
  id: string;
  tenantId: string;
  role: TenantMembershipRole;
  status: TenantMembershipStatus;
}

/**
 * What the tenant context guard needs to know about the caller's membership.
 * Declared here so the guard stays below every module; tenancy implements it
 * (TenancyPortsModule).
 */
export interface MembershipAccessLookup {
  findMembership(
    tenantId: string,
    userId: string,
  ): Promise<MembershipAccess | null>;
}

export const MEMBERSHIP_ACCESS_LOOKUP = Symbol('MEMBERSHIP_ACCESS_LOOKUP');
