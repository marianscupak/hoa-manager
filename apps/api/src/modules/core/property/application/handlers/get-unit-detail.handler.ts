import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { type UnitOwnerRef } from '@/modules/core/property/application/handlers/list-units.handler';
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
import { UnitNotFoundException } from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

export type {
  UnitOwnershipDetailItem,
  UnitOwnershipDetailMember,
} from '@/modules/core/property/application/handlers/ownership-party.mapper';

// Named explicitly rather than `extends Unit`: `katastr_unit_id` is an
// internal matching key with no screen to appear on, and listing the
// fields here means a future column on `units` does not silently join
// this response.
export interface UnitDetail {
  id: string;
  tenantId: string;
  unitNo: string;
  buildingShareNumerator: number;
  buildingShareDenominator: number;
  usageCode: string | null;
  usageName: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerships: UnitOwnershipDetailItem[];
  owners: string[];
  ownerRefs: UnitOwnerRef[];
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

    // Deduplicated by id, not by name: namesakes are two owners. The names
    // come from the same list so `owners` and `ownerRefs` cannot disagree.
    const ownerRefs = [
      ...new Set(ownerships.flatMap((p) => p.memberOwnerIds)),
    ].flatMap((id) => {
      const displayName = ownersById.get(id)?.displayName;
      return displayName ? [{ id, displayName }] : [];
    });

    return {
      id: unit.id,
      tenantId: unit.tenantId,
      unitNo: unit.unitNo,
      buildingShareNumerator: unit.buildingShareNumerator,
      buildingShareDenominator: unit.buildingShareDenominator,
      usageCode: unit.usageCode,
      usageName: unit.usageName,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
      ownerships: ownerships.map((party) =>
        toOwnershipPartyItem(party, ownersById),
      ),
      owners: ownerRefs.map((ref) => ref.displayName),
      ownerRefs,
    };
  }
}
