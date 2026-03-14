import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { GetOwnerByIdQuery } from '@/modules/core/property/application/queries/get-owner-by-id.query';

@QueryHandler(GetOwnerByIdQuery)
export class GetOwnerByIdHandler implements IQueryHandler<GetOwnerByIdQuery> {
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
  ) {}

  async execute(query: GetOwnerByIdQuery) {
    return this.ownerRepo.findById(query.tenantId, query.ownerId);
  }
}
