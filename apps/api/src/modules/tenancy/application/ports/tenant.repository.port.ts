import {
  Tenant,
  TenantMembership,
} from '@/modules/tenancy/domain/tenant.entity';

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

export interface MembershipRepository {
  findByUserId(userId: string): Promise<TenantMembership[]>;
  findByTenantAndUser(
    tenantId: string,
    userId: string,
  ): Promise<TenantMembership | null>;
  findTenantsWithMembership(userId: string): Promise<TenantWithMembership[]>;
  create(
    membership: Omit<
      TenantMembership,
      'id' | 'createdAt' | 'updatedAt' | 'lastSeenAt'
    >,
  ): Promise<TenantMembership>;
  updateStatus(
    id: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'INVITED',
  ): Promise<void>;
}

export const MEMBERSHIP_REPOSITORY = Symbol('MEMBERSHIP_REPOSITORY');
