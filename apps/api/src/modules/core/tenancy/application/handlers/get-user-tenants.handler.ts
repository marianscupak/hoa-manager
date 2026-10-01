import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TenantResponseDto } from '@/modules/core/tenancy/api/dto/tenant-response.dto';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { GetUserTenantsQuery } from '@/modules/core/tenancy/application/queries/get-user-tenants.query';
import { TenantMembershipStatus } from '@/shared/domain/membership';

@QueryHandler(GetUserTenantsQuery)
export class GetUserTenantsHandler
  implements IQueryHandler<GetUserTenantsQuery>
{
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
  ) {}

  async execute(query: GetUserTenantsQuery): Promise<TenantResponseDto[]> {
    const records = await this.membershipRepository.findTenantsWithMembership(
      query.userId,
    );

    // Only associations the user can actually enter: switching into any
    // other one is refused, so listing it would offer a dead end.
    return records
      .filter((record) => record.status === TenantMembershipStatus.ACTIVE)
      .map((record) => ({
        id: record.tenantId,
        name: record.tenantName,
        role: record.role,
        status: record.status,
      }));
  }
}
