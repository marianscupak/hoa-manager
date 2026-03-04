import { ConflictException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { normalizeEmail } from '../../../../shared/application/utils/normalize-email';
import { CreateOwnerCommand } from '../commands/create-owner.command';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '../ports/property.repository.port';

@CommandHandler(CreateOwnerCommand)
export class CreateOwnerHandler implements ICommandHandler<
  CreateOwnerCommand,
  { ownerId: string }
> {
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
  ) {}

  async execute(command: CreateOwnerCommand): Promise<{ ownerId: string }> {
    const email = command.email ? normalizeEmail(command.email) : null;

    if (email) {
      const existing = await this.ownerRepo.findByEmail(
        command.tenantId,
        email,
      );
      if (existing) {
        throw new ConflictException(
          'An owner with this email already exists in this community.',
        );
      }
    }

    const newOwner = await this.ownerRepo.create(
      command.tenantId,
      command.displayName,
      command.userId,
      email,
    );

    return { ownerId: newOwner.id };
  }
}
