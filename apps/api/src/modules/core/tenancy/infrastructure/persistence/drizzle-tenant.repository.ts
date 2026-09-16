import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { tenants, tenantMemberships, users } from '@/infrastructure/db/schema';
import {
  TenantRepository,
  MembershipRepository,
  type TenantWithMembership,
  type TenantMembershipWithUser,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import {
  Tenant,
  TenantMembership,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';

@Injectable()
export class DrizzleTenantRepository implements TenantRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  async findById(id: string): Promise<Tenant | null> {
    const row = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });
    return row ?? null;
  }

  async create(name: string): Promise<Tenant> {
    const [inserted] = await this.db
      .insert(tenants)
      .values({ name })
      .returning();
    return inserted;
  }
}

@Injectable()
export class DrizzleMembershipRepository implements MembershipRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  async findByUserId(userId: string): Promise<TenantMembership[]> {
    return this.db.query.tenantMemberships.findMany({
      where: eq(tenantMemberships.userId, userId),
    });
  }

  async findByTenantAndUser(
    tenantId: string,
    userId: string,
  ): Promise<TenantMembership | null> {
    const row = await this.db.query.tenantMemberships.findFirst({
      where: and(
        eq(tenantMemberships.tenantId, tenantId),
        eq(tenantMemberships.userId, userId),
      ),
    });
    return row ?? null;
  }

  async findById(id: string): Promise<TenantMembership | null> {
    const row = await this.db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.id, id),
    });
    return row ?? null;
  }

  async findTenantsWithMembership(
    userId: string,
  ): Promise<TenantWithMembership[]> {
    const rows = await this.db
      .select({
        tenantId: tenants.id,
        tenantName: tenants.name,
        role: tenantMemberships.role,
        status: tenantMemberships.status,
      })
      .from(tenantMemberships)
      .innerJoin(tenants, eq(tenants.id, tenantMemberships.tenantId))
      .where(eq(tenantMemberships.userId, userId));

    return rows;
  }

  async create(
    membership: Omit<
      TenantMembership,
      'id' | 'createdAt' | 'updatedAt' | 'lastSeenAt'
    >,
  ): Promise<TenantMembership> {
    const [inserted] = await this.db
      .insert(tenantMemberships)
      .values({
        tenantId: membership.tenantId,
        userId: membership.userId,
        role: membership.role,
        status: membership.status,
      })
      .returning();
    return inserted;
  }

  // Both writes carry the tenant in the predicate, not only in the caller.
  // The handlers do check it, but a membership id is a bare uuid and the next
  // caller may not — and getting it wrong here changes someone's role in
  // another association.
  async updateStatus(
    tenantId: string,
    id: string,
    status: TenantMembershipStatus,
  ): Promise<void> {
    await this.db
      .update(tenantMemberships)
      .set({ status })
      .where(
        and(
          eq(tenantMemberships.tenantId, tenantId),
          eq(tenantMemberships.id, id),
        ),
      );
  }

  async updateRole(
    tenantId: string,
    id: string,
    role: TenantMembership['role'],
  ): Promise<void> {
    await this.db
      .update(tenantMemberships)
      .set({ role })
      .where(
        and(
          eq(tenantMemberships.tenantId, tenantId),
          eq(tenantMemberships.id, id),
        ),
      );
  }

  async listByTenant(tenantId: string): Promise<TenantMembershipWithUser[]> {
    const rows = await this.db
      .select({
        id: tenantMemberships.id,
        tenantId: tenantMemberships.tenantId,
        userId: tenantMemberships.userId,
        role: tenantMemberships.role,
        status: tenantMemberships.status,
        createdAt: tenantMemberships.createdAt,
        updatedAt: tenantMemberships.updatedAt,
        lastSeenAt: tenantMemberships.lastSeenAt,
        user: {
          id: users.id,
          email: users.email,
          fullName: users.fullName,
        },
      })
      .from(tenantMemberships)
      .innerJoin(users, eq(tenantMemberships.userId, users.id))
      .where(eq(tenantMemberships.tenantId, tenantId));

    return rows as TenantMembershipWithUser[];
  }
}
