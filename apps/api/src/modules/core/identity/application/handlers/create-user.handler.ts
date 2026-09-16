import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateUserCommand } from '@/modules/core/identity/application/commands/create-user.command';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/core/identity/application/ports/user.repository.port';
import { UserAlreadyExistsError } from '@/modules/core/identity/domain/errors/user-already-exists.error';
import { User } from '@/modules/core/identity/domain/user.entity';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(cmd: CreateUserCommand): Promise<{ id: string }> {
    const existing = await this.users.findByEmail(cmd.email);

    if (existing) {
      throw new UserAlreadyExistsError();
    }

    const inserted = await this.users.create(
      User.createNew({
        email: cmd.email,
        fullName: cmd.fullName,
        isEmailVerified: cmd.isEmailVerified,
      }),
    );

    return { id: inserted.id };
  }
}
