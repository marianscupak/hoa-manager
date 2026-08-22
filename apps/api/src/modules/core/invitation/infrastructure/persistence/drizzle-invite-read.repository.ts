import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { ownerInvites } from '@/infrastructure/db/schema';
import {
  InviteReadRepository,
  PendingInviteSummary,
} from '@/modules/core/invitation/application/ports/invite-read.repository.port';

@Injectable()
export class DrizzleInviteReadRepository implements InviteReadRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  /**
   * "Pending" matches the `ListOwnersHandler` definition: invite rows
   * with `accepted_at IS NULL` AND `expires_at > now`. Expired,
   * unaccepted invites are not counted.
   */
  async getPendingSummary(
    tenantId: string,
    now: Date,
  ): Promise<PendingInviteSummary> {
    const [row] = await this.db
      .select({
        pending: sql<number>`COUNT(*)::int`,
        oldestPendingCreatedAt: sql<Date | null>`MIN(${ownerInvites.createdAt})`,
      })
      .from(ownerInvites)
      .where(
        and(
          eq(ownerInvites.tenantId, tenantId),
          isNull(ownerInvites.acceptedAt),
          gt(ownerInvites.expiresAt, now),
        ),
      );

    return {
      pending: Number(row?.pending ?? 0),
      oldestPendingCreatedAt: row?.oldestPendingCreatedAt
        ? new Date(row.oldestPendingCreatedAt)
        : null,
    };
  }
}
