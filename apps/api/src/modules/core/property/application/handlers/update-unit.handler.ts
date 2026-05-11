import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UpdateUnitCommand } from '@/modules/core/property/application/commands/update-unit.command';
import {
  UNIT_REPOSITORY,
  type UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import {
  DuplicateUnitNumberException,
  InvalidOwnershipShareException,
  UnitNotFoundException,
} from '@/shared/application/exceptions/property.exceptions';

@CommandHandler(UpdateUnitCommand)
export class UpdateUnitHandler
  implements ICommandHandler<UpdateUnitCommand, void>
{
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepo: UnitRepository,
  ) {}

  async execute(command: UpdateUnitCommand): Promise<void> {
    if (
      !Number.isInteger(command.buildingShareNumerator) ||
      !Number.isInteger(command.buildingShareDenominator) ||
      command.buildingShareNumerator <= 0 ||
      command.buildingShareDenominator <= 0
    ) {
      throw new InvalidOwnershipShareException();
    }

    const existing = await this.unitRepo.findById(
      command.tenantId,
      command.unitId,
    );
    if (!existing) {
      throw new UnitNotFoundException();
    }

    try {
      await this.unitRepo.update(
        command.tenantId,
        command.unitId,
        command.unitNo,
        command.buildingShareNumerator,
        command.buildingShareDenominator,
      );
    } catch (error: any) {
      if (error.code === '23505') {
        throw new DuplicateUnitNumberException();
      }
      throw error;
    }
  }
}
