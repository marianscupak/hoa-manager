import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { GetMembershipsByUserIdQuery } from '@/modules/core/tenancy/application/queries/get-memberships-by-user-id.query';

@QueryHandler(GetMembershipsByUserIdQuery)
export class GetMembershipsByUserIdHandler
  implements IQueryHandler<GetMembershipsByUserIdQuery>
{
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: MembershipRepository,
  ) {}

  async execute(query: GetMembershipsByUserIdQuery) {
    return this.membershipRepo.findByUserId(query.userId);
  }
}
