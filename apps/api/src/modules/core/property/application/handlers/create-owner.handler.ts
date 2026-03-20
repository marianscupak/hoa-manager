import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';

import { GetUserByIdQuery } from '@/modules/core/identity/application/queries/get-user-by-id.query';
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
    private readonly queryBus: QueryBus,
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

    let resolvedUserId = command.userId;

    if (email && !resolvedUserId && command.executorId) {
      const executor = await this.queryBus.execute(
        new GetUserByIdQuery(command.executorId),
      );
      if (
        executor &&
        executor.email &&
        email.toLowerCase() === executor.email.toLowerCase()
      ) {
        resolvedUserId = executor.id;
      }
    }

    const newOwner = await this.ownerRepo.create(
      command.tenantId,
      command.displayName,
      resolvedUserId,
      email,
    );

    return { ownerId: newOwner.id };
  }
}
