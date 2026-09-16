import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { GetMembershipByTenantAndUserQuery } from '@/modules/core/tenancy/application/queries/get-membership-by-tenant-and-user.query';

@QueryHandler(GetMembershipByTenantAndUserQuery)
export class GetMembershipByTenantAndUserHandler implements IQueryHandler<GetMembershipByTenantAndUserQuery> {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: MembershipRepository,
  ) {}

  async execute(query: GetMembershipByTenantAndUserQuery) {
    return this.membershipRepo.findByTenantAndUser(
      query.tenantId,
      query.userId,
    );
  }
}
