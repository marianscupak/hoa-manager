import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { tenantMemberships } from '@/infrastructure/db/schema/core/tenant-memberships';
import { units } from '@/infrastructure/db/schema/core/units';
import { users } from '@/infrastructure/db/schema/core/users';
import type { AuditActor } from '@/modules/core/audit/domain/actor';

@Injectable()
export class VotingAuditLabelResolver {
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

  async resolveMembershipLabel(membershipId: string): Promise<string> {
    const [row] = await this.db
      .select({ fullName: users.fullName })
      .from(tenantMemberships)
      .innerJoin(users, eq(users.id, tenantMemberships.userId))
      .where(eq(tenantMemberships.id, membershipId))
      .limit(1);
    return row?.fullName ?? `Member ${membershipId.slice(0, 8)}`;
  }

  async resolveUnitLabel(unitId: string): Promise<string> {
    const [row] = await this.db
      .select({ unitNo: units.unitNo })
      .from(units)
      .where(eq(units.id, unitId))
      .limit(1);
    return row?.unitNo ?? `Unit ${unitId.slice(0, 8)}`;
  }
}
