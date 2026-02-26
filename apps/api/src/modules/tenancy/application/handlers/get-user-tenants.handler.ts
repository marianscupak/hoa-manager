import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TenantResponseDto } from '../../api/dto/tenant-response.dto';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '../ports/tenant.repository.port';
import { GetUserTenantsQuery } from '../queries/get-user-tenants.query';

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

    return records.map((record) => ({
      id: record.tenantId,
      name: record.tenantName,
      role: record.role,
      status: record.status,
    }));
  }
}
