import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import {
  ownershipActiveAt,
  unitOwnershipMembers,
  unitOwnerships,
  units,
} from '@/infrastructure/db/schema';
import { type PeopleHoldingsRepository } from '@/modules/core/tenancy/application/ports/people-holdings.repository.port';
import { type PeopleHoldingRow } from '@/modules/core/tenancy/domain/people-union';

/**
 * Reads `unit_ownerships` from tenancy, which is property's table.
 *
 * That is deliberate and confined to the read side, the way the voting
 * module's `drizzle-electorate-data.repository.ts` already reads both
 * `owners` and `tenant_memberships`. Nothing here writes.
 */
@Injectable()
export class DrizzlePeopleHoldingsRepository
  implements PeopleHoldingsRepository
{
  constructor(private readonly drizzle: DrizzleService) {}

  async findHoldings(tenantId: string, now: Date): Promise<PeopleHoldingRow[]> {
    return await this.drizzle.db
      .select({
        ownerId: unitOwnershipMembers.ownerId,
        unitId: unitOwnerships.unitId,
        unitShareNum: units.buildingShareNumerator,
        unitShareDen: units.buildingShareDenominator,
        partyShareNum: unitOwnerships.shareNumerator,
        partyShareDen: unitOwnerships.shareDenominator,
      })
      .from(unitOwnershipMembers)
      .innerJoin(
        unitOwnerships,
        eq(unitOwnershipMembers.ownershipId, unitOwnerships.id),
      )
      .innerJoin(units, eq(unitOwnerships.unitId, units.id))
      .where(
        and(eq(unitOwnerships.tenantId, tenantId), ownershipActiveAt(now)),
      );
  }
}
