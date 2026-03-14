import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UpdateUserLanguageCommand } from '@/modules/core/identity/application/commands/update-user-language.command';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/core/identity/application/ports/user.repository.port';

@CommandHandler(UpdateUserLanguageCommand)
export class UpdateUserLanguageHandler
  implements ICommandHandler<UpdateUserLanguageCommand>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  async execute(command: UpdateUserLanguageCommand): Promise<void> {
    const user = await this.userRepo.findById(command.userId);
    if (!user) {
      return;
    }

    user.preferredLanguage = command.language;
    await this.userRepo.update(user.id, {
      preferredLanguage: user.preferredLanguage,
    });
  }
}
