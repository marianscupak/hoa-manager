import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from '@/modules/core/auth/auth.module';
import { IdentityModule } from '@/modules/core/identity/identity.module';
import { TenancyController } from '@/modules/core/tenancy/api/tenancy.controller';
import { CreateTenantHandler } from '@/modules/core/tenancy/application/handlers/create-tenant.handler';
import { GetUserTenantsHandler } from '@/modules/core/tenancy/application/handlers/get-user-tenants.handler';
import {
  MEMBERSHIP_REPOSITORY,
  TENANT_REPOSITORY,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import {
  DrizzleMembershipRepository,
  DrizzleTenantRepository,
} from '@/modules/core/tenancy/infrastructure/persistence/drizzle-tenant.repository';

@Module({
  imports: [CqrsModule, IdentityModule, forwardRef(() => AuthModule)],
  controllers: [TenancyController],
  providers: [
    { provide: TENANT_REPOSITORY, useClass: DrizzleTenantRepository },
    { provide: MEMBERSHIP_REPOSITORY, useClass: DrizzleMembershipRepository },
    GetUserTenantsHandler,
    CreateTenantHandler,
  ],
  exports: [TENANT_REPOSITORY, MEMBERSHIP_REPOSITORY],
})
export class TenancyModule {}
