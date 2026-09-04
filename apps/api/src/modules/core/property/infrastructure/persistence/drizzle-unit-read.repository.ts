import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import {
  owners,
  ownershipActiveAt,
  ownershipActiveAtSql,
  tenantMemberships,
  unitOwnershipMembers,
  unitOwnerships,
  units,
} from '@/infrastructure/db/schema';
import {
  OwnedUnitRow,
  UnitOverview,
  UnitReadRepository,
} from '@/modules/core/property/application/ports/unit-read.repository.port';

@Injectable()
export class DrizzleUnitReadRepository implements UnitReadRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  async getOverview(tenantId: string, now: Date): Promise<UnitOverview> {
    // Inside the correlated subquery, column refs need explicit table
    // prefixes — Drizzle's `${table.column}` drops the table name, which
    // makes the inner WHERE resolve both sides to `unit_ownerships`.
    const [row] = await this.db
      .select({
        total: sql<number>`COUNT(*)::int`,
        withoutOwnersCount: sql<number>`COUNT(*) FILTER (
          WHERE NOT EXISTS (
            SELECT 1
            FROM ${unitOwnerships}
            WHERE ${unitOwnerships}.tenant_id = ${units}.tenant_id
              AND ${unitOwnerships}.unit_id = ${units}.id
              AND ${ownershipActiveAtSql(now)}
          )
        )::int`,
        buildingShareSum: sql<number>`COALESCE(
          ROUND(
            SUM(
              ${units.buildingShareNumerator}::numeric
              / NULLIF(${units.buildingShareDenominator}, 0)::numeric
            ) * 100,
            2
          ),
          0
        )::float8`,
      })
      .from(units)
      .where(eq(units.tenantId, tenantId));

    return {
      total: Number(row?.total ?? 0),
      withoutOwnersCount: Number(row?.withoutOwnersCount ?? 0),
      buildingShareSum: Number(row?.buildingShareSum ?? 0),
    };
  }

  async findOwnedByMembership(params: {
    tenantId: string;
    membershipId: string;
    now: Date;
  }): Promise<OwnedUnitRow[]> {
    // `unit_ownerships` no longer has an `owner_id` column — a party's
    // members live in `unit_ownership_members`, and owners link to a
    // user via `owners.user_id`. The owner -> membership join therefore
    // mirrors the pattern used by
    // `DrizzleElectorateDataRepository.findOwnershipRecords`: bridge
    // through `unit_ownership_members` to the owner, then match the
    // owner to the membership row sharing the same `(tenant_id,
    // user_id)` pair.
    //
    // `owners_tenant_user_unique` guarantees at most one owner per
    // (tenant, user), and `closeActiveByUnit` + `createMany` +
    // `validateOwnershipPlan`'s DUPLICATE_OWNER check guarantee an owner
    // is a member of at most one party matching `ownershipActiveAt` per
    // unit at a time — so this join yields at most one row per unit per
    // membership and no aggregation is needed. `shareNumerator /
    // shareDenominator` is the party's full undivided share (an SJM
    // party isn't split between its two member-owners), converted to a
    // percentage the same way `buildingShareNumerator /
    // buildingShareDenominator * 100` is in `getOverview`'s
    // `buildingShareSum` — both rounded to two decimal places for
    // consistency.
    const rows = await this.db
      .select({
        id: units.id,
        unitNo: units.unitNo,
        partyType: unitOwnerships.partyType,
        ownerSharePct: sql<number>`ROUND(
          (
            ${unitOwnerships.shareNumerator}::numeric
            / NULLIF(${unitOwnerships.shareDenominator}, 0)::numeric
          ) * 100,
          2
        )::float8`,
        buildingSharePct: sql<number>`ROUND(
          (
            ${units.buildingShareNumerator}::numeric
            / NULLIF(${units.buildingShareDenominator}, 0)::numeric
          ) * 100,
          2
        )::float8`,
      })
      .from(units)
      .innerJoin(
        unitOwnerships,
        and(
          eq(unitOwnerships.unitId, units.id),
          eq(unitOwnerships.tenantId, units.tenantId),
          ownershipActiveAt(params.now),
        ),
      )
      .innerJoin(
        unitOwnershipMembers,
        eq(unitOwnershipMembers.ownershipId, unitOwnerships.id),
      )
      .innerJoin(owners, eq(unitOwnershipMembers.ownerId, owners.id))
      .innerJoin(
        tenantMemberships,
        and(
          eq(tenantMemberships.userId, owners.userId),
          eq(tenantMemberships.tenantId, owners.tenantId),
        ),
      )
      .where(
        and(
          eq(units.tenantId, params.tenantId),
          eq(tenantMemberships.id, params.membershipId),
        ),
      );

    return rows.map(
      (r: {
        id: string;
        unitNo: string;
        partyType: 'SOLE' | 'SJM';
        ownerSharePct: number | null;
        buildingSharePct: number | null;
      }) => ({
        id: r.id,
        unitNo: r.unitNo,
        partyType: r.partyType,
        ownerSharePct: Number(r.ownerSharePct ?? 0),
        buildingSharePct: Number(r.buildingSharePct ?? 0),
      }),
    );
  }
}
