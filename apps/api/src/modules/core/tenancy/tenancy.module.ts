import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuditModule } from '@/modules/core/audit/audit.module';
import { AuditProjectionsModule } from '@/modules/core/audit-projections/audit-projections.module';
import { IdentityModule } from '@/modules/core/identity/identity.module';
import { MemberController } from '@/modules/core/tenancy/api/member.controller';
import { TenancyController } from '@/modules/core/tenancy/api/tenancy.controller';
import { ChangeMemberStatusHandler } from '@/modules/core/tenancy/application/handlers/change-member-status.handler';
import { CreateMembershipHandler } from '@/modules/core/tenancy/application/handlers/create-membership.handler';
import { CreateTenantHandler } from '@/modules/core/tenancy/application/handlers/create-tenant.handler';
import { GetMembershipByTenantAndUserHandler } from '@/modules/core/tenancy/application/handlers/get-membership-by-tenant-and-user.handler';
import { GetMembershipsByUserIdHandler } from '@/modules/core/tenancy/application/handlers/get-memberships-by-user-id.handler';
import { GetTenantByIdHandler } from '@/modules/core/tenancy/application/handlers/get-tenant-by-id.handler';
import { GetUserTenantsHandler } from '@/modules/core/tenancy/application/handlers/get-user-tenants.handler';
import { ListTenantContactsHandler } from '@/modules/core/tenancy/application/handlers/list-tenant-contacts.handler';
import { ListTenantMembersHandler } from '@/modules/core/tenancy/application/handlers/list-tenant-members.handler';
import { UpdateMemberRoleHandler } from '@/modules/core/tenancy/application/handlers/update-member-role.handler';
import { UpdateMembershipStatusHandler } from '@/modules/core/tenancy/application/handlers/update-membership-status.handler';
import {
  MEMBERSHIP_REPOSITORY,
  TENANT_REPOSITORY,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { TenancyAuditRegistration } from '@/modules/core/tenancy/audit/tenancy-audit.registration';
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
];

@Module({
  imports: [CqrsModule, IdentityModule, AuditModule, AuditProjectionsModule],
  controllers: [TenancyController, MemberController],
  providers: [
    { provide: TENANT_REPOSITORY, useClass: DrizzleTenantRepository },
    { provide: MEMBERSHIP_REPOSITORY, useClass: DrizzleMembershipRepository },
    TenancyAuditRegistration,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [],
})
export class TenancyModule {}
