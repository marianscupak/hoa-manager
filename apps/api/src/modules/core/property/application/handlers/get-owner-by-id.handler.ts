import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { GetOwnerByIdQuery } from '@/modules/core/property/application/queries/get-owner-by-id.query';
import type { OwnerKind } from '@/modules/core/property/domain/ownership-plan';

// Named explicitly rather than returning the `Owner` entity as-is:
// `katastr_person_id` identifies a person in a state register and has no
// screen to appear on, and listing the fields here means a future column
// on `owners` does not silently join this result.
export interface OwnerDetail {
  id: string;
  tenantId: string;
  displayName: string;
  email: string | null;
  userId: string | null;
  kind: OwnerKind;
  ico: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(GetOwnerByIdQuery)
export class GetOwnerByIdHandler
  implements IQueryHandler<GetOwnerByIdQuery, OwnerDetail | null>
{
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
  ) {}

  async execute(query: GetOwnerByIdQuery): Promise<OwnerDetail | null> {
    const owner = await this.ownerRepo.findById(query.tenantId, query.ownerId);
    if (!owner) {
      return null;
    }

    return {
      id: owner.id,
      tenantId: owner.tenantId,
      displayName: owner.displayName,
      email: owner.email,
      userId: owner.userId,
      kind: owner.kind,
      ico: owner.ico,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt,
    };
  }
}
