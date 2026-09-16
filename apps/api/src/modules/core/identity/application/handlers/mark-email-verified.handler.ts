import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { MarkEmailVerifiedCommand } from '@/modules/core/identity/application/commands/mark-email-verified.command';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/core/identity/application/ports/user.repository.port';

/**
 * Records that an identity provider has proven the user owns their address.
 *
 * Needed as its own command because the flag was only ever written by the
 * seeds: a user who signed in with Google stayed unverified forever and could
 * not accept an owner invite, even though Google had verified the address
 * before the login was allowed through.
 */
@CommandHandler(MarkEmailVerifiedCommand)
export class MarkEmailVerifiedHandler
  implements ICommandHandler<MarkEmailVerifiedCommand>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  async execute(command: MarkEmailVerifiedCommand): Promise<void> {
    const user = await this.userRepo.findById(command.userId);
    if (!user || user.isEmailVerified) {
      return;
    }

    await this.userRepo.update(user.id, { isEmailVerified: true });
  }
}
