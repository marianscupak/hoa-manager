import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { ListTenantContactsQuery } from '@/modules/core/tenancy/application/queries/list-tenant-contacts.query';
import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/shared/domain/membership';

export interface TenantContact {
  fullName: string;
  email: string;
}

/**
 * Who a unit owner can write to about the association: the active ADMIN
 * members, i.e. the committee chair in practice. Deliberately narrower than
 * `ListTenantMembers` (which is admin-only and exposes every member) so it
 * can be served to any authenticated member of the tenant.
 */
@QueryHandler(ListTenantContactsQuery)
export class ListTenantContactsHandler
  implements IQueryHandler<ListTenantContactsQuery>
{
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
  ) {}

  async execute(query: ListTenantContactsQuery): Promise<TenantContact[]> {
    const members = await this.membershipRepository.listByTenant(
      query.tenantId,
    );
    return members
      .filter(
        (m) =>
          m.role === TenantMembershipRole.ADMIN &&
          m.status === TenantMembershipStatus.ACTIVE,
      )
      .map((m) => ({ fullName: m.user.fullName, email: m.user.email }));
  }
}
