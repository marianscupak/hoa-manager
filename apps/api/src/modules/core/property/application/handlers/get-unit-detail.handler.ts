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
import { GetUnitDetailQuery } from '@/modules/core/property/application/queries/get-unit-detail.query';
import { Unit } from '@/modules/core/property/domain/property.entity';
import { UnitNotFoundException } from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

export type {
  UnitOwnershipDetailItem,
  UnitOwnershipDetailMember,
} from '@/modules/core/property/application/handlers/ownership-party.mapper';

export interface UnitDetail extends Unit {
  ownerships: UnitOwnershipDetailItem[];
  owners: string[];
}

@QueryHandler(GetUnitDetailQuery)
export class GetUnitDetailHandler
  implements IQueryHandler<GetUnitDetailQuery, UnitDetail>
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

  async execute(query: GetUnitDetailQuery): Promise<UnitDetail> {
    const unit = await this.unitRepo.findById(query.tenantId, query.unitId);

    if (!unit) {
      throw new UnitNotFoundException();
    }

    const [ownerships, tenantOwners] = await Promise.all([
      this.ownershipRepo.listActiveByUnit(
        query.tenantId,
        query.unitId,
        this.clock.now(),
      ),
      this.ownerRepo.listByTenant(query.tenantId),
    ]);

    const ownersById = new Map(tenantOwners.map((o) => [o.id, o]));

    const owners = [
      ...new Set(
        ownerships
          .flatMap((p) => p.memberOwnerIds)
          .map((id) => ownersById.get(id)?.displayName)
          .filter((name): name is string => !!name),
      ),
    ];

    return {
      ...unit,
      ownerships: ownerships.map((party) =>
        toOwnershipPartyItem(party, ownersById),
      ),
      owners,
    };
  }
}
