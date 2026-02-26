import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { TenancyController } from './api/tenancy.controller';
import { AuthModule } from '../auth/auth.module';
import { GetUserTenantsHandler } from './application/handlers/get-user-tenants.handler';
import {
  MEMBERSHIP_REPOSITORY,
  TENANT_REPOSITORY,
} from './application/ports/tenant.repository.port';
import {
  DrizzleMembershipRepository,
  DrizzleTenantRepository,
} from './infrastructure/persistence/drizzle-tenant.repository';

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule)],
  controllers: [TenancyController],
  providers: [
    { provide: TENANT_REPOSITORY, useClass: DrizzleTenantRepository },
    { provide: MEMBERSHIP_REPOSITORY, useClass: DrizzleMembershipRepository },
    GetUserTenantsHandler,
  ],
  exports: [TENANT_REPOSITORY, MEMBERSHIP_REPOSITORY],
})
export class TenancyModule {}
