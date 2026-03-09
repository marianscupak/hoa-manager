import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateOwnerCommand } from '@/modules/core/property/application/commands/create-owner.command';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { DuplicateOwnerEmailException } from '@/shared/application/exceptions/property.exceptions';
import { normalizeEmail } from '@/shared/application/utils/normalize-email';

@CommandHandler(CreateOwnerCommand)
export class CreateOwnerHandler
  implements ICommandHandler<CreateOwnerCommand, { ownerId: string }>
{
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
        throw new DuplicateOwnerEmailException();
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
