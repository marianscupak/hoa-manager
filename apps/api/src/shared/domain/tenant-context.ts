import type {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';

export interface TenantContext {
  tenantId: string;
  membershipId: string;
  roles: TenantMembershipRole[];
  membershipStatus: TenantMembershipStatus;
}
