import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { DrizzleService } from '../../../../infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '../../../../infrastructure/db/drizzle.unit-of-work';
import {
  tenants,
  tenantMemberships,
} from '../../../../infrastructure/db/schema';
import {
  TenantRepository,
  MembershipRepository,
  type TenantWithMembership,
} from '../../application/ports/tenant.repository.port';
import { Tenant, TenantMembership } from '../../domain/tenant.entity';

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

  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'INVITED',
  ): Promise<void> {
    await this.db
      .update(tenantMemberships)
      .set({ status })
      .where(eq(tenantMemberships.id, id));
  }
}
