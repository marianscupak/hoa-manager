import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DeleteOwnerCommand } from '@/modules/core/property/application/commands/delete-owner.command';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/modules/core/property/application/ports/property.repository.port';

@CommandHandler(DeleteOwnerCommand)
export class DeleteOwnerHandler implements ICommandHandler<DeleteOwnerCommand> {
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepository: OwnerRepository,
  ) {}

  async execute(command: DeleteOwnerCommand): Promise<void> {
    await this.ownerRepository.delete(command.tenantId, command.ownerId);
  }
}
