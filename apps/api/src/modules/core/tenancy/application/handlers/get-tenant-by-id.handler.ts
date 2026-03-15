import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  TENANT_REPOSITORY,
  type TenantRepository,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { GetTenantByIdQuery } from '@/modules/core/tenancy/application/queries/get-tenant-by-id.query';

@QueryHandler(GetTenantByIdQuery)
export class GetTenantByIdHandler implements IQueryHandler<GetTenantByIdQuery> {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepo: TenantRepository,
  ) {}

  async execute(query: GetTenantByIdQuery) {
    return this.tenantRepo.findById(query.tenantId);
  }
}
