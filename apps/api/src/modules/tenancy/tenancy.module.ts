import { Module } from '@nestjs/common';

import {
  MEMBERSHIP_REPOSITORY,
  TENANT_REPOSITORY,
} from './application/ports/tenant.repository.port';
import {
  DrizzleMembershipRepository,
  DrizzleTenantRepository,
} from './infrastructure/persistence/drizzle-tenant.repository';

@Module({
  providers: [
    { provide: TENANT_REPOSITORY, useClass: DrizzleTenantRepository },
    { provide: MEMBERSHIP_REPOSITORY, useClass: DrizzleMembershipRepository },
  ],
  exports: [TENANT_REPOSITORY, MEMBERSHIP_REPOSITORY],
})
export class TenancyModule {}
