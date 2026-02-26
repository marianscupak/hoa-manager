import type {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '../../modules/tenancy/domain/tenant.entity';

export interface TenantContext {
  tenantId: string;
  membershipId: string;
  roles: TenantMembershipRole[];
  membershipStatus: TenantMembershipStatus;
}
