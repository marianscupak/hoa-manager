import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { ownerInvites, owners } from '@/infrastructure/db/schema';
import { OwnerReadRepository } from '@/modules/core/property/application/ports/owner-read.repository.port';

@Injectable()
export class DrizzleOwnerReadRepository implements OwnerReadRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  /**
   * Counts owners that are not in a pending-invite state. Mirrors the
   * predicate used by `ListOwnersHandler`:
   *   inviteStatus = 'pending' when
   *     userId IS NULL AND email IS NOT NULL AND a non-accepted invite
   *     with expires_at > now exists for the owner.
   *
   * Active = NOT pending. Expired-but-not-accepted invites surface as
   * `inviteStatus = 'expired'` in the owner listing, so those owners
   * are counted as active here.
   */
  async countActive(tenantId: string, now: Date): Promise<number> {
    // Inside the correlated subquery, column refs need explicit table
    // prefixes — Drizzle's `${table.column}` drops the table name, which
    // makes the inner WHERE resolve both sides to `owner_invites`.
    const [row] = await this.db
      .select({
        active: sql<number>`COUNT(*) FILTER (
          WHERE NOT (
            ${owners}.user_id IS NULL
            AND ${owners}.email IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM ${ownerInvites}
              WHERE ${ownerInvites}.tenant_id = ${owners}.tenant_id
                AND ${ownerInvites}.owner_id = ${owners}.id
                AND ${ownerInvites}.accepted_at IS NULL
                AND ${ownerInvites}.expires_at > ${now}
            )
          )
        )::int`,
      })
      .from(owners)
      .where(eq(owners.tenantId, tenantId));

    return Number(row?.active ?? 0);
  }
}
