import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SetUserNameCommand } from '@/modules/core/identity/application/commands/set-user-name.command';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/core/identity/application/ports/user.repository.port';

@CommandHandler(SetUserNameCommand)
export class SetUserNameHandler implements ICommandHandler<SetUserNameCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  async execute(command: SetUserNameCommand): Promise<void> {
    await this.userRepo.update(command.userId, { fullName: command.fullName });
  }
}
