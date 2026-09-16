import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
  type TenantMembershipWithUser,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { ListTenantMembersQuery } from '@/modules/core/tenancy/application/queries/list-tenant-members.query';

@QueryHandler(ListTenantMembersQuery)
export class ListTenantMembersHandler implements IQueryHandler<ListTenantMembersQuery> {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
  ) {}

  async execute(
    query: ListTenantMembersQuery,
  ): Promise<TenantMembershipWithUser[]> {
    return this.membershipRepository.listByTenant(query.tenantId);
  }
}
