import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { owners } from '@/infrastructure/db/schema/core/owners';
import { tenants } from '@/infrastructure/db/schema/core/tenants';
import { units } from '@/infrastructure/db/schema/core/units';
import { users } from '@/infrastructure/db/schema/core/users';
import type { AuditActor } from '@/modules/core/audit/domain/actor';

@Injectable()
export class CoreAuditLabelResolver {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return (DRIZZLE_TX_STORAGE.getStore() ??
      this.drizzle.db) as typeof this.drizzle.db;
  }

  async resolveActorLabel(actor: AuditActor): Promise<string> {
    return actor.type === 'SYSTEM'
      ? `System (${actor.reason})`
      : this.resolveUserLabel(actor.userId);
  }

  async resolveUserLabel(userId: string): Promise<string> {
    const [row] = await this.db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row?.fullName ?? `User ${userId.slice(0, 8)}`;
  }

  async resolveTenantLabel(tenantId: string): Promise<string> {
    const [row] = await this.db
      .select({ name: tenants.name })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    return row?.name ?? `Tenant ${tenantId.slice(0, 8)}`;
  }

  async resolveUnitLabel(unitId: string): Promise<string> {
    const [row] = await this.db
      .select({ unitNo: units.unitNo })
      .from(units)
      .where(eq(units.id, unitId))
      .limit(1);
    return row?.unitNo ?? `Unit ${unitId.slice(0, 8)}`;
  }

  async resolveOwnerLabel(ownerId: string): Promise<string> {
    const [row] = await this.db
      .select({ displayName: owners.displayName })
      .from(owners)
      .where(eq(owners.id, ownerId))
      .limit(1);
    return row?.displayName ?? `Owner ${ownerId.slice(0, 8)}`;
  }
}
