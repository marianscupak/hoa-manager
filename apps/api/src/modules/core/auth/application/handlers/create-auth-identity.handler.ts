import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateAuthIdentityCommand } from '@/modules/core/auth/application/commands/create-auth-identity.command';
import {
  AUTH_IDENTITY_REPOSITORY,
  type AuthIdentityRepository,
} from '@/modules/core/auth/application/ports/auth.repository.port';

@CommandHandler(CreateAuthIdentityCommand)
export class CreateAuthIdentityHandler
  implements ICommandHandler<CreateAuthIdentityCommand>
{
  constructor(
    @Inject(AUTH_IDENTITY_REPOSITORY)
    private readonly authIdentityRepo: AuthIdentityRepository,
  ) {}

  async execute(command: CreateAuthIdentityCommand): Promise<void> {
    await this.authIdentityRepo.create({
      userId: command.userId,
      provider: command.provider,
      providerSubject: command.providerSubject,
      passwordHash: command.passwordHash,
    });
  }
}
