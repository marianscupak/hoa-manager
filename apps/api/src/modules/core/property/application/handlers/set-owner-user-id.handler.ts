import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SetOwnerUserIdCommand } from '@/modules/core/property/application/commands/set-owner-user-id.command';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/modules/core/property/application/ports/property.repository.port';

@CommandHandler(SetOwnerUserIdCommand)
export class SetOwnerUserIdHandler
  implements ICommandHandler<SetOwnerUserIdCommand>
{
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
  ) {}

  async execute(command: SetOwnerUserIdCommand): Promise<void> {
    await this.ownerRepo.setUserId(
      command.tenantId,
      command.ownerId,
      command.userId,
    );
  }
}
