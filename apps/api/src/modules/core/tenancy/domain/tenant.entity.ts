import type {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/shared/domain/membership';

export interface Tenant {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantMembershipRole;
  status: TenantMembershipStatus;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date | null;
}
