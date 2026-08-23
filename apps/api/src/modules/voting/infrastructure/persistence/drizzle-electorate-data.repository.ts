import { Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import {
  owners,
  tenantMemberships,
  unitOwnershipMembers,
  unitOwnerships,
  units,
  voteUnitConsents,
} from '@/infrastructure/db/schema';
import {
  type OwnerKind,
  type OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';

import {
  ElectorateConsentData,
  ElectorateDataRepository,
  ElectorateOwnershipPartyData,
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
        buildingShareNumerator: units.buildingShareNumerator,
        buildingShareDenominator: units.buildingShareDenominator,
      })
      .from(units)
      .where(eq(units.tenantId, tenantId));
  }

  async findOwnershipParties(
    tenantId: string,
  ): Promise<ElectorateOwnershipPartyData[]> {
    const partyRows = await this.drizzle.db
      .select({
        ownershipId: unitOwnerships.id,
        unitId: unitOwnerships.unitId,
        partyType: unitOwnerships.partyType,
        shareNumerator: unitOwnerships.shareNumerator,
        shareDenominator: unitOwnerships.shareDenominator,
      })
      .from(unitOwnerships)
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          isNull(unitOwnerships.validTo),
        ),
      );

    if (partyRows.length === 0) return [];

    const memberRows = await this.drizzle.db
      .select({
        ownershipId: unitOwnershipMembers.ownershipId,
        ownerId: unitOwnershipMembers.ownerId,
        ownerKind: owners.kind,
        membershipId: tenantMemberships.id,
      })
      .from(unitOwnershipMembers)
      .innerJoin(owners, eq(unitOwnershipMembers.ownerId, owners.id))
      .leftJoin(
        tenantMemberships,
        and(
          eq(owners.userId, tenantMemberships.userId),
          eq(owners.tenantId, tenantMemberships.tenantId),
        ),
      )
      .where(
        inArray(
          unitOwnershipMembers.ownershipId,
          partyRows.map((p) => p.ownershipId),
        ),
      );

    const membersByOwnership = new Map<
      string,
      ElectorateOwnershipPartyData['members']
    >();
    for (const row of memberRows) {
      const list = membersByOwnership.get(row.ownershipId) ?? [];
      list.push({
        ownerId: row.ownerId,
        ownerKind: row.ownerKind as OwnerKind,
        membershipId: row.membershipId,
      });
      membersByOwnership.set(row.ownershipId, list);
    }

    return partyRows.map((p) => ({
      ownershipId: p.ownershipId,
      unitId: p.unitId,
      partyType: p.partyType as OwnershipPartyType,
      shareNumerator: p.shareNumerator,
      shareDenominator: p.shareDenominator,
      members: membersByOwnership.get(p.ownershipId) ?? [],
    }));
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
