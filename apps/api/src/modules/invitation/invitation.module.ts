import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '../../infrastructure/db/drizzle.unit-of-work';
import { ConsoleEmailSender } from '../../infrastructure/email/console-email-sender';
import { EMAIL_SENDER } from '../../infrastructure/email/email-sender.port';
import { UNIT_OF_WORK } from '../../shared/application/ports/unit-of-work.port';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { PropertyModule } from '../property/property.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { InviteController } from './api/invite.controller';
import { AcceptOwnerInviteHandler } from './application/handlers/accept-owner-invite.handler';
import { GetOwnerInviteStatusHandler } from './application/handlers/get-owner-invite-status.handler';
import { RegisterFromInviteHandler } from './application/handlers/register-from-invite.handler';
import { SendOwnerInviteHandler } from './application/handlers/send-owner-invite.handler';
import { OWNER_INVITE_REPOSITORY } from './application/ports/owner-invite.repository.port';
import { DrizzleOwnerInviteRepository } from './infrastructure/persistence/drizzle-owner-invite.repository';

const CommandHandlers = [
  SendOwnerInviteHandler,
  AcceptOwnerInviteHandler,
  RegisterFromInviteHandler,
];

const QueryHandlers = [GetOwnerInviteStatusHandler];

@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    IdentityModule,
    TenancyModule,
    forwardRef(() => PropertyModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [InviteController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: OWNER_INVITE_REPOSITORY,
      useClass: DrizzleOwnerInviteRepository,
    },
    { provide: EMAIL_SENDER, useClass: ConsoleEmailSender },
    { provide: UNIT_OF_WORK, useClass: DrizzleUnitOfWork },
  ],
})
export class InvitationModule {}
