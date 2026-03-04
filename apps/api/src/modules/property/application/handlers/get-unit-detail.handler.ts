import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UnitNotFoundException } from '../../../../shared/application/exceptions/property.exceptions';
import { Unit, UnitOwnership } from '../../domain/property.entity';
import {
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
  type UnitOwnershipRepository,
  type UnitRepository,
} from '../ports/property.repository.port';
import { GetUnitDetailQuery } from '../queries/get-unit-detail.query';

export interface UnitDetail extends Unit {
  ownerships: UnitOwnership[];
}

@QueryHandler(GetUnitDetailQuery)
export class GetUnitDetailHandler implements IQueryHandler<
  GetUnitDetailQuery,
  UnitDetail
> {
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepo: UnitRepository,
    @Inject(UNIT_OWNERSHIP_REPOSITORY)
    private readonly ownershipRepo: UnitOwnershipRepository,
  ) {}

  async execute(query: GetUnitDetailQuery): Promise<UnitDetail> {
    const unit = await this.unitRepo.findById(query.tenantId, query.unitId);

    if (!unit) {
      throw new UnitNotFoundException();
    }

    const ownerships = await this.ownershipRepo.listActiveByUnit(
      query.tenantId,
      query.unitId,
    );

    return {
      ...unit,
      ownerships,
    };
  }
}
