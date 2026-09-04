import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  toOwnershipPartyItem,
  type UnitOwnershipDetailItem,
} from '@/modules/core/property/application/handlers/ownership-party.mapper';
import {
  OWNER_REPOSITORY,
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
  type OwnerRepository,
  type UnitOwnershipRepository,
  type UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { GetUnitOwnershipHistoryQuery } from '@/modules/core/property/application/queries/get-unit-ownership-history.query';
import {
  groupIntoPeriods,
  type OwnershipPeriodStatus,
} from '@/modules/core/property/domain/ownership-periods';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { UnitNotFoundException } from '@/shared/application/exceptions/property.exceptions';
import { NotAUnitOwnerException } from '@/shared/application/exceptions/vote.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

export interface UnitOwnershipHistoryPeriod {
  validFrom: Date;
  validTo: Date | null;
  status: OwnershipPeriodStatus;
  parties: UnitOwnershipDetailItem[];
}

export interface UnitOwnershipHistory {
  unitId: string;
  unitNo: string;
  /**
   * The unit's share of the building's common parts, as the stored
   * fraction. Carried here so an owner-facing unit page can be built
   * from this one response: a former owner — and the incoming owner of
   * a scheduled transfer — may read this history yet has no row in
   * `GET /units/mine`, which only lists ownership active now.
   */
  buildingShareNumerator: number;
  buildingShareDenominator: number;
  periods: UnitOwnershipHistoryPeriod[];
}

/**
 * Every ownership period of a unit, newest first. Admins and board members
 * may read any unit; other members only units they have owned at some point
 * (past, current or scheduled) — a former owner may need the record to show
 * when they held the unit.
 */
@QueryHandler(GetUnitOwnershipHistoryQuery)
export class GetUnitOwnershipHistoryHandler
  implements IQueryHandler<GetUnitOwnershipHistoryQuery, UnitOwnershipHistory>
{
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepo: UnitRepository,
    @Inject(UNIT_OWNERSHIP_REPOSITORY)
    private readonly ownershipRepo: UnitOwnershipRepository,
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(
    query: GetUnitOwnershipHistoryQuery,
  ): Promise<UnitOwnershipHistory> {
    const unit = await this.unitRepo.findById(query.tenantId, query.unitId);
    if (!unit) throw new UnitNotFoundException();

    const privileged =
      query.roles.includes(TenantMembershipRole.ADMIN) ||
      query.roles.includes(TenantMembershipRole.BOARD_MEMBER);
    if (!privileged) {
      const owned = await this.ownershipRepo.hasEverOwnedUnit(
        query.tenantId,
        query.unitId,
        query.membershipId,
      );
      if (!owned) throw new NotAUnitOwnerException();
    }

    const [parties, tenantOwners] = await Promise.all([
      this.ownershipRepo.listByUnit(query.tenantId, query.unitId),
      this.ownerRepo.listByTenant(query.tenantId),
    ]);
    const ownersById = new Map(tenantOwners.map((o) => [o.id, o]));

    return {
      unitId: unit.id,
      unitNo: unit.unitNo,
      buildingShareNumerator: unit.buildingShareNumerator,
      buildingShareDenominator: unit.buildingShareDenominator,
      periods: groupIntoPeriods(parties, this.clock.now()).map((period) => ({
        validFrom: period.validFrom,
        validTo: period.validTo,
        status: period.status,
        parties: period.parties.map((p) => toOwnershipPartyItem(p, ownersById)),
      })),
    };
  }
}
