import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateUnitCommand } from '@/modules/core/property/application/commands/create-unit.command';
import {
  UNIT_REPOSITORY,
  type UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import {
  DuplicateUnitNumberException,
  InvalidOwnershipShareException,
} from '@/shared/application/exceptions/property.exceptions';

@CommandHandler(CreateUnitCommand)
export class CreateUnitHandler
  implements ICommandHandler<CreateUnitCommand, { unitId: string }>
{
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepo: UnitRepository,
  ) {}

  async execute(command: CreateUnitCommand): Promise<{ unitId: string }> {
    if (
      !Number.isInteger(command.buildingShareNumerator) ||
      !Number.isInteger(command.buildingShareDenominator) ||
      command.buildingShareNumerator <= 0 ||
      command.buildingShareDenominator <= 0
    ) {
      throw new InvalidOwnershipShareException();
    }

    try {
      const newUnit = await this.unitRepo.create(
        command.tenantId,
        command.unitNo,
        command.buildingShareNumerator,
        command.buildingShareDenominator,
      );

      return { unitId: newUnit.id };
    } catch (error: any) {
      if (error.code === '23505') {
        // Postgres unique constraint violation
        throw new DuplicateUnitNumberException();
      }
      throw error;
    }
  }
}
