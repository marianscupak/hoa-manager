import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { EmailModule } from '@/infrastructure/email/email.module';
import { AuditModule } from '@/modules/core/audit/audit.module';
import { AuditProjectionsModule } from '@/modules/core/audit-projections/audit-projections.module';
import { AuthModule } from '@/modules/core/auth/auth.module';
import { IdentityModule } from '@/modules/core/identity/identity.module';
import { InviteController } from '@/modules/core/invitation/api/invite.controller';
import { AcceptOwnerInviteHandler } from '@/modules/core/invitation/application/handlers/accept-owner-invite.handler';
import { GetOwnerInviteStatusHandler } from '@/modules/core/invitation/application/handlers/get-owner-invite-status.handler';
import { GetPendingInviteByOwnerIdHandler } from '@/modules/core/invitation/application/handlers/get-pending-invite-by-owner-id.handler';
import { RegisterFromInviteHandler } from '@/modules/core/invitation/application/handlers/register-from-invite.handler';
import { RevokeOwnerInviteHandler } from '@/modules/core/invitation/application/handlers/revoke-owner-invite.handler';
import { SendOwnerInviteHandler } from '@/modules/core/invitation/application/handlers/send-owner-invite.handler';
import { INVITE_READ_REPOSITORY } from '@/modules/core/invitation/application/ports/invite-read.repository.port';
import { OWNER_INVITE_REPOSITORY } from '@/modules/core/invitation/application/ports/owner-invite.repository.port';
import { InvitationAuditRegistration } from '@/modules/core/invitation/audit/invitation-audit.registration';
import { DrizzleInviteReadRepository } from '@/modules/core/invitation/infrastructure/persistence/drizzle-invite-read.repository';
import { DrizzleOwnerInviteRepository } from '@/modules/core/invitation/infrastructure/persistence/drizzle-owner-invite.repository';
import { PropertyModule } from '@/modules/core/property/property.module';
import { TenancyModule } from '@/modules/core/tenancy/tenancy.module';
import { UNIT_OF_WORK } from '@/shared/application/ports/unit-of-work.port';

const CommandHandlers = [
  SendOwnerInviteHandler,
  AcceptOwnerInviteHandler,
  RegisterFromInviteHandler,
  RevokeOwnerInviteHandler,
];

const QueryHandlers = [
  GetOwnerInviteStatusHandler,
  GetPendingInviteByOwnerIdHandler,
];

@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    EmailModule,
    IdentityModule,
    TenancyModule,
    forwardRef(() => PropertyModule),
    forwardRef(() => AuthModule),
    AuditModule,
    AuditProjectionsModule,
  ],
  controllers: [InviteController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: OWNER_INVITE_REPOSITORY,
      useClass: DrizzleOwnerInviteRepository,
    },
    {
      provide: INVITE_READ_REPOSITORY,
      useClass: DrizzleInviteReadRepository,
    },
    { provide: UNIT_OF_WORK, useClass: DrizzleUnitOfWork },
    InvitationAuditRegistration,
  ],
  exports: [OWNER_INVITE_REPOSITORY, INVITE_READ_REPOSITORY],
})
export class InvitationModule {}
