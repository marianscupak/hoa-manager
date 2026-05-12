import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DeleteUnitCommand } from '@/modules/core/property/application/commands/delete-unit.command';
import {
  UNIT_REPOSITORY,
  type UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';

@CommandHandler(DeleteUnitCommand)
export class DeleteUnitHandler implements ICommandHandler<DeleteUnitCommand> {
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepository: UnitRepository,
  ) {}

  async execute(command: DeleteUnitCommand): Promise<void> {
    await this.unitRepository.delete(command.tenantId, command.unitId);
  }
}
