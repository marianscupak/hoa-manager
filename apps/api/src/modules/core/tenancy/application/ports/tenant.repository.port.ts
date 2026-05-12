import {
  Tenant,
  TenantMembership,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';

export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>;
  create(name: string): Promise<Tenant>;
}

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');

export interface TenantWithMembership {
  tenantId: string;
  tenantName: string;
  role: TenantMembership['role'];
  status: TenantMembership['status'];
}

export interface TenantMembershipWithUser extends TenantMembership {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface MembershipRepository {
  findByUserId(userId: string): Promise<TenantMembership[]>;
  findByTenantAndUser(
    tenantId: string,
    userId: string,
  ): Promise<TenantMembership | null>;
  findById(id: string): Promise<TenantMembership | null>;
  findTenantsWithMembership(userId: string): Promise<TenantWithMembership[]>;
  create(
    membership: Omit<
      TenantMembership,
      'id' | 'createdAt' | 'updatedAt' | 'lastSeenAt'
    >,
  ): Promise<TenantMembership>;
  updateStatus(id: string, status: TenantMembershipStatus): Promise<void>;
  updateRole(id: string, role: TenantMembership['role']): Promise<void>;
  listByTenant(tenantId: string): Promise<TenantMembershipWithUser[]>;
}

export const MEMBERSHIP_REPOSITORY = Symbol('MEMBERSHIP_REPOSITORY');
