import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from '@/modules/auth/auth.module';
import { IdentityModule } from '@/modules/identity/identity.module';
import { TenancyController } from '@/modules/tenancy/api/tenancy.controller';
import { CreateTenantHandler } from '@/modules/tenancy/application/handlers/create-tenant.handler';
import { GetUserTenantsHandler } from '@/modules/tenancy/application/handlers/get-user-tenants.handler';
import {
  MEMBERSHIP_REPOSITORY,
  TENANT_REPOSITORY,
} from '@/modules/tenancy/application/ports/tenant.repository.port';
import {
  DrizzleMembershipRepository,
  DrizzleTenantRepository,
} from '@/modules/tenancy/infrastructure/persistence/drizzle-tenant.repository';

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
