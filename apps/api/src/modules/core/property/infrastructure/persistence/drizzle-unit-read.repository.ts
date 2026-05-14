import { Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import {
  owners,
  tenantMemberships,
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

  async getOverview(tenantId: string): Promise<UnitOverview> {
    // One aggregation pass over units in the tenant. `withoutOwnersCount`
    // uses a NOT EXISTS subquery against `unit_ownerships` (active rows
    // are those with `valid_to IS NULL` — matches the existing predicate
    // used by `DrizzleUnitOwnershipRepository.listActiveByUnit`).
    //
    // `buildingShareSum` converts each unit's integer fraction
    // (numerator / denominator) to a percentage, sums it, and rounds to
    // two decimals so consumers can render and threshold without
    // worrying about float drift.
    const [row] = await this.db
      .select({
        total: sql<number>`COUNT(*)::int`,
        withoutOwnersCount: sql<number>`COUNT(*) FILTER (
          WHERE NOT EXISTS (
            SELECT 1
            FROM ${unitOwnerships}
            WHERE ${unitOwnerships.tenantId} = ${units.tenantId}
              AND ${unitOwnerships.unitId} = ${units.id}
              AND ${unitOwnerships.validTo} IS NULL
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
  }): Promise<OwnedUnitRow[]> {
    // `unit_ownerships` has no `membership_id` column — it points at
    // `owner_id`, and owners link to a user via `owners.user_id`. The
    // owner -> membership join therefore mirrors the pattern used by
    // `DrizzleElectorateDataRepository.findOwnershipRecords`: match the
    // owner to the membership row sharing the same `(tenant_id, user_id)`
    // pair.
    //
    // `share` is stored on a 0..1 scale (per `list-units.handler`'s
    // `Math.abs(sum - 1.0)` completeness check), so multiplying by 100
    // converts it to a percentage. `buildingShareNumerator /
    // buildingShareDenominator * 100` matches the formula used by
    // `getOverview`'s `buildingShareSum`. Both are rounded to two
    // decimal places for consistency.
    //
    // GROUP BY unit guarantees one row per unit even in the (data-bug)
    // case where a membership owns the same unit through two active
    // ownership rows — the percentages are summed rather than
    // duplicated.
    const rows = await this.db
      .select({
        id: units.id,
        unitNo: units.unitNo,
        ownerSharePct: sql<number>`ROUND(
          (SUM(${unitOwnerships.share}) * 100)::numeric,
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
          isNull(unitOwnerships.validTo),
        ),
      )
      .innerJoin(owners, eq(unitOwnerships.ownerId, owners.id))
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
      )
      .groupBy(
        units.id,
        units.unitNo,
        units.buildingShareNumerator,
        units.buildingShareDenominator,
      );

    return rows.map(
      (r: {
        id: string;
        unitNo: string;
        ownerSharePct: number | null;
        buildingSharePct: number | null;
      }) => ({
        id: r.id,
        unitNo: r.unitNo,
        ownerSharePct: Number(r.ownerSharePct ?? 0),
        buildingSharePct: Number(r.buildingSharePct ?? 0),
      }),
    );
  }
}
