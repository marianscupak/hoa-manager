export interface Tenant {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TenantMembershipRole {
  ADMIN = 'ADMIN',
  BOARD_MEMBER = 'BOARD_MEMBER',
  AUDITOR = 'AUDITOR',
  UNIT_OWNER = 'UNIT_OWNER',
}

export enum TenantMembershipStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INVITED = 'INVITED',
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
