import { randomUUID } from 'crypto';

import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { User } from '../../domain/user.entity';
import { RegisterUserCommand } from '../commands/create-user.command';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../ports/user-repository.port';

@CommandHandler(RegisterUserCommand)
export class CreateUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(cmd: RegisterUserCommand): Promise<{ id: string }> {
    const existing = await this.users.findByEmail(cmd.email);

    if (existing) {
      throw new UserAlreadyExistsError();
    }

    const user = User.createNew({
      id: randomUUID(),
      email: cmd.email,
    });

    await this.users.insert(user);

    return { id: user.id };
  }
}
