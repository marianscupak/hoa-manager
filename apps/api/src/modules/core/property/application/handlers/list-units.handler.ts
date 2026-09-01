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
import { Unit } from '@/modules/core/property/domain/property.entity';
import { Rational } from '@/shared/domain/rational';

export interface UnitWithStatus extends Unit {
  isOwnershipComplete: boolean;
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
  ) {}

  async execute(query: ListUnitsQuery): Promise<UnitWithStatus[]> {
    const [units, tenantOwners] = await Promise.all([
      this.unitRepo.listByTenant(query.tenantId),
      this.ownerRepo.listByTenant(query.tenantId),
    ]);
    const namesById = new Map(tenantOwners.map((o) => [o.id, o.displayName]));

    // TODO: In a real app with many units, this N+1 query should be optimized
    // with a join in the repository or a dataloader, but for MVP it's OK.
    const result: UnitWithStatus[] = [];

    for (const unit of units) {
      const ownerships = await this.ownershipRepo.listActiveByUnit(
        query.tenantId,
        unit.id,
      );

      const sum = Rational.sum(
        ownerships.map((o) =>
          Rational.from(o.shareNumerator, o.shareDenominator),
        ),
      );
      const isComplete = sum.eq(Rational.one());

      const owners = [
        ...new Set(
          ownerships
            .flatMap((o) => o.memberOwnerIds)
            .map((id) => namesById.get(id))
            .filter((name): name is string => !!name),
        ),
      ];

      result.push({
        ...unit,
        isOwnershipComplete: isComplete,
        owners,
      });
    }

    return result;
  }
}
