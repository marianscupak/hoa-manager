import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  OWNER_REPOSITORY,
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
  type OwnerRepository,
  type UnitOwnershipRepository,
  type UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { ListUnitsQuery } from '@/modules/core/property/application/queries/list-units.query';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

// Named explicitly rather than `extends Unit`: `katastr_unit_id` is an
// internal matching key with no screen to appear on, and listing the
// fields here means a future column on `units` does not silently join
// this response.
export interface UnitWithStatus {
  id: string;
  tenantId: string;
  unitNo: string;
  buildingShareNumerator: number;
  buildingShareDenominator: number;
  usageCode: string | null;
  usageName: string | null;
  createdAt: Date;
  updatedAt: Date;
  owners: string[];
}

@QueryHandler(ListUnitsQuery)
export class ListUnitsHandler
  implements IQueryHandler<ListUnitsQuery, UnitWithStatus[]>
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

  async execute(query: ListUnitsQuery): Promise<UnitWithStatus[]> {
    const [units, tenantOwners] = await Promise.all([
      this.unitRepo.listByTenant(query.tenantId),
      this.ownerRepo.listByTenant(query.tenantId),
    ]);
    const namesById = new Map(tenantOwners.map((o) => [o.id, o.displayName]));
    const now = this.clock.now();

    // TODO: In a real app with many units, this N+1 query should be optimized
    // with a join in the repository or a dataloader, but for MVP it's OK.
    const result: UnitWithStatus[] = [];

    for (const unit of units) {
      const ownerships = await this.ownershipRepo.listActiveByUnit(
        query.tenantId,
        unit.id,
        now,
      );

      const owners = [
        ...new Set(
          ownerships
            .flatMap((o) => o.memberOwnerIds)
            .map((id) => namesById.get(id))
            .filter((name): name is string => !!name),
        ),
      ];

      result.push({
        id: unit.id,
        tenantId: unit.tenantId,
        unitNo: unit.unitNo,
        buildingShareNumerator: unit.buildingShareNumerator,
        buildingShareDenominator: unit.buildingShareDenominator,
        usageCode: unit.usageCode,
        usageName: unit.usageName,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
        owners,
      });
    }

    return result;
  }
}
