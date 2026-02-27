import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Owner } from '../../domain/property.entity';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '../ports/property.repository.port';
import { ListOwnersQuery } from '../queries/list-owners.query';

@QueryHandler(ListOwnersQuery)
export class ListOwnersHandler implements IQueryHandler<
  ListOwnersQuery,
  Owner[]
> {
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
  ) {}

  async execute(query: ListOwnersQuery): Promise<Owner[]> {
    return this.ownerRepo.listByTenant(query.tenantId);
  }
}
