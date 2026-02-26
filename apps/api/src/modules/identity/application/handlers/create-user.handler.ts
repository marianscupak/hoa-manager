import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { User } from '../../domain/user.entity';
import { CreateUserCommand } from '../commands/create-user.command';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../ports/user.repository.port';

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
      User.createNew({ email: cmd.email, fullName: cmd.fullName }),
    );

    return { id: inserted.id };
  }
}
