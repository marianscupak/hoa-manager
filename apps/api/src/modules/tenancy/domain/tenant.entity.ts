export interface Tenant {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TenantMembershipRole =
  | 'ADMIN'
  | 'BOARD_MEMBER'
  | 'AUDITOR'
  | 'UNIT_OWNER';

export type TenantMembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'INVITED';

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
