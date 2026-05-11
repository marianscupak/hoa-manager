import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import {
  owners,
  tenantMemberships,
  unitOwnerships,
  units,
  voteUnitConsents,
} from '@/infrastructure/db/schema';

import {
  ElectorateConsentData,
  ElectorateDataRepository,
  ElectorateOwnershipData,
  ElectorateUnitData,
} from '../../application/ports/electorate-data.repository.port';

@Injectable()
export class DrizzleElectorateDataRepository
  implements ElectorateDataRepository
{
  constructor(private readonly drizzle: DrizzleService) {}

  async findAllUnits(tenantId: string): Promise<ElectorateUnitData[]> {
    return await this.drizzle.db
      .select({
        id: units.id,
        buildingShare: units.buildingShare,
      })
      .from(units)
      .where(eq(units.tenantId, tenantId));
  }

  async findOwnershipRecords(
    tenantId: string,
  ): Promise<ElectorateOwnershipData[]> {
    return await this.drizzle.db
      .select({
        unitId: unitOwnerships.unitId,
        ownerId: unitOwnerships.ownerId,
        membershipId: tenantMemberships.id,
      })
      .from(unitOwnerships)
      .innerJoin(owners, eq(unitOwnerships.ownerId, owners.id))
      .leftJoin(
        tenantMemberships,
        and(
          eq(owners.userId, tenantMemberships.userId),
          eq(owners.tenantId, tenantMemberships.tenantId),
        ),
      )
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          isNull(unitOwnerships.validTo),
        ),
      );
  }

  async findValidConsents(
    tenantId: string,
    voteId: string,
  ): Promise<ElectorateConsentData[]> {
    return await this.drizzle.db
      .select({
        unitId: voteUnitConsents.unitId,
        fromOwnerId: voteUnitConsents.fromOwnerId,
        toMembershipId: voteUnitConsents.toMembershipId,
      })
      .from(voteUnitConsents)
      .where(
        and(
          eq(voteUnitConsents.tenantId, tenantId),
          eq(voteUnitConsents.voteId, voteId),
          eq(voteUnitConsents.status, 'VALID'),
        ),
      );
  }
}
