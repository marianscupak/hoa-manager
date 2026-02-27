import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../identity/application/ports/user.repository.port';
import { CreateOwnerCommand } from '../commands/create-owner.command';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '../ports/property.repository.port';

@CommandHandler(CreateOwnerCommand)
export class CreateOwnerHandler
  implements ICommandHandler<CreateOwnerCommand, { ownerId: string }>
{
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  async execute(command: CreateOwnerCommand): Promise<{ ownerId: string }> {
    if (command.userId) {
      const user = await this.userRepo.findById(command.userId);
      if (!user) {
        throw new NotFoundException(`User with id ${command.userId} not found`);
      }

      // TODO: move to uow, connect user to owner
    }

    const newOwner = await this.ownerRepo.create(
      command.tenantId,
      command.displayName,
      command.userId,
    );

    return { ownerId: newOwner.id };
  }
}
