import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Unit } from '../../domain/property.entity';
import {
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
  type UnitOwnershipRepository,
  type UnitRepository,
} from '../ports/property.repository.port';
import { ListUnitsQuery } from '../queries/list-units.query';

export interface UnitWithStatus extends Unit {
  isOwnershipComplete: boolean;
}

@QueryHandler(ListUnitsQuery)
export class ListUnitsHandler implements IQueryHandler<
  ListUnitsQuery,
  UnitWithStatus[]
> {
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepo: UnitRepository,
    @Inject(UNIT_OWNERSHIP_REPOSITORY)
    private readonly ownershipRepo: UnitOwnershipRepository,
  ) {}

  async execute(query: ListUnitsQuery): Promise<UnitWithStatus[]> {
    const units = await this.unitRepo.listByTenant(query.tenantId);

    // TODO: In a real app with many units, this N+1 query should be optimized
    // with a join in the repository or a dataloader, but for MVP it's OK.
    const result: UnitWithStatus[] = [];

    for (const unit of units) {
      const ownerships = await this.ownershipRepo.listActiveByUnit(
        query.tenantId,
        unit.id,
      );

      const sum = ownerships.reduce(
        (acc, curr) => acc + parseFloat(curr.share),
        0,
      );
      const isComplete = Math.abs(sum - 1.0) <= 0.000001;

      result.push({
        ...unit,
        isOwnershipComplete: isComplete,
      });
    }

    return result;
  }
}
