import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateSessionCommand } from '@/modules/core/auth/application/commands/create-session.command';
import {
  AUTH_SESSION_SERVICE,
  type AuthSessionService,
} from '@/modules/core/auth/infrastructure/auth-session.service';

@CommandHandler(CreateSessionCommand)
export class CreateSessionHandler
  implements ICommandHandler<CreateSessionCommand>
{
  constructor(
    @Inject(AUTH_SESSION_SERVICE)
    private readonly authSessionService: AuthSessionService,
  ) {}

  async execute(command: CreateSessionCommand) {
    return this.authSessionService.createSession(command.userId, {
      sub: command.userId,
      email: command.email,
      fullName: command.fullName,
      preferredLanguage: command.preferredLanguage,
      tid: command.tenantId,
      mid: command.membershipId,
      roles: command.roles,
    });
  }
}
