import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import {
  ownershipActiveAt,
  unitOwnershipMembers,
  unitOwnerships,
  units,
} from '@/infrastructure/db/schema';
import { type PeopleHoldingsRepository } from '@/modules/core/property/application/ports/people-holdings.repository.port';
import { type PeopleHoldingRow } from '@/modules/core/property/domain/people-union';

/**
 * Who holds which unit, and in what share, for the people overview. Reads
 * only the register's own tables; the member half of the overview comes from
 * tenancy through `ListTenantMembersQuery`.
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
