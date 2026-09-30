import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuditModule } from '@/modules/core/audit/audit.module';
import { AuditProjectionsModule } from '@/modules/core/audit-projections/audit-projections.module';
import { AuthModule } from '@/modules/core/auth/auth.module';
import { IdentityModule } from '@/modules/core/identity/identity.module';
import { MemberController } from '@/modules/core/tenancy/api/member.controller';
import { PeopleController } from '@/modules/core/tenancy/api/people.controller';
import { TenancyController } from '@/modules/core/tenancy/api/tenancy.controller';
import { ChangeMemberStatusHandler } from '@/modules/core/tenancy/application/handlers/change-member-status.handler';
import { CreateMembershipHandler } from '@/modules/core/tenancy/application/handlers/create-membership.handler';
import { CreateTenantHandler } from '@/modules/core/tenancy/application/handlers/create-tenant.handler';
import { GetMembershipByTenantAndUserHandler } from '@/modules/core/tenancy/application/handlers/get-membership-by-tenant-and-user.handler';
import { GetMembershipsByUserIdHandler } from '@/modules/core/tenancy/application/handlers/get-memberships-by-user-id.handler';
import { GetTenantByIdHandler } from '@/modules/core/tenancy/application/handlers/get-tenant-by-id.handler';
import { GetUserTenantsHandler } from '@/modules/core/tenancy/application/handlers/get-user-tenants.handler';
import { ListPeopleHandler } from '@/modules/core/tenancy/application/handlers/list-people.handler';
import { ListTenantContactsHandler } from '@/modules/core/tenancy/application/handlers/list-tenant-contacts.handler';
import { ListTenantMembersHandler } from '@/modules/core/tenancy/application/handlers/list-tenant-members.handler';
import { UpdateMemberRoleHandler } from '@/modules/core/tenancy/application/handlers/update-member-role.handler';
import { UpdateMembershipStatusHandler } from '@/modules/core/tenancy/application/handlers/update-membership-status.handler';
import { PEOPLE_HOLDINGS_REPOSITORY } from '@/modules/core/tenancy/application/ports/people-holdings.repository.port';
import {
  MEMBERSHIP_REPOSITORY,
  TENANT_REPOSITORY,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { TenancyAuditRegistration } from '@/modules/core/tenancy/audit/tenancy-audit.registration';
import { DrizzlePeopleHoldingsRepository } from '@/modules/core/tenancy/infrastructure/persistence/drizzle-people-holdings.repository';
import {
  DrizzleMembershipRepository,
  DrizzleTenantRepository,
} from '@/modules/core/tenancy/infrastructure/persistence/drizzle-tenant.repository';

const CommandHandlers = [
  CreateTenantHandler,
  CreateMembershipHandler,
  UpdateMembershipStatusHandler,
  UpdateMemberRoleHandler,
  ChangeMemberStatusHandler,
];
const QueryHandlers = [
  GetUserTenantsHandler,
  GetMembershipByTenantAndUserHandler,
  GetTenantByIdHandler,
  GetMembershipsByUserIdHandler,
  ListTenantMembersHandler,
  ListTenantContactsHandler,
  ListPeopleHandler,
];

@Module({
  imports: [
    CqrsModule,
    IdentityModule,
    forwardRef(() => AuthModule),
    forwardRef(() => AuditModule),
    AuditProjectionsModule,
  ],
  controllers: [TenancyController, MemberController, PeopleController],
  providers: [
    { provide: TENANT_REPOSITORY, useClass: DrizzleTenantRepository },
    { provide: MEMBERSHIP_REPOSITORY, useClass: DrizzleMembershipRepository },
    {
      provide: PEOPLE_HOLDINGS_REPOSITORY,
      useClass: DrizzlePeopleHoldingsRepository,
    },
    TenancyAuditRegistration,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [],
})
export class TenancyModule {}
