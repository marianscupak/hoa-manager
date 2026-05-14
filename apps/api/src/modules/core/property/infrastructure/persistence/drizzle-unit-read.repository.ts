import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { unitOwnerships, units } from '@/infrastructure/db/schema';
import {
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
}
