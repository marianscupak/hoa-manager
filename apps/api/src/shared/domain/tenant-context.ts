import type {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/shared/domain/membership';

export interface TenantContext {
  tenantId: string;
  membershipId: string;
  roles: TenantMembershipRole[];
  membershipStatus: TenantMembershipStatus;
}
