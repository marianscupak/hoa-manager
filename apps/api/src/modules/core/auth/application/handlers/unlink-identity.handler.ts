import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UnlinkIdentityCommand } from '@/modules/core/auth/application/commands/unlink-identity.command';
import {
  AUTH_IDENTITY_REPOSITORY,
  type AuthIdentityRepository,
} from '@/modules/core/auth/application/ports/auth.repository.port';
import {
  IdentityNotLinkedException,
  LastIdentityException,
} from '@/shared/application/exceptions/auth.exceptions';

@CommandHandler(UnlinkIdentityCommand)
export class UnlinkIdentityHandler
  implements ICommandHandler<UnlinkIdentityCommand, void>
{
  constructor(
    @Inject(AUTH_IDENTITY_REPOSITORY)
    private readonly identityRepository: AuthIdentityRepository,
  ) {}

  async execute(command: UnlinkIdentityCommand): Promise<void> {
    const identities = await this.identityRepository.listByUser(command.userId);

    if (!identities.some((i) => i.provider === command.provider)) {
      throw new IdentityNotLinkedException();
    }

    // Removing the last one would lock the account out of itself, with no
    // way back short of a database edit.
    if (identities.length <= 1) {
      throw new LastIdentityException();
    }

    await this.identityRepository.deleteByUserAndProvider(
      command.userId,
      command.provider,
    );
  }
}
