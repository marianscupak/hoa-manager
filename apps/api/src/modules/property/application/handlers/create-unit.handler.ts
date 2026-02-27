import { Inject, ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateUnitCommand } from '../commands/create-unit.command';
import {
  UNIT_REPOSITORY,
  type UnitRepository,
} from '../ports/property.repository.port';

@CommandHandler(CreateUnitCommand)
export class CreateUnitHandler
  implements ICommandHandler<CreateUnitCommand, { unitId: string }>
{
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepo: UnitRepository,
  ) {}

  async execute(command: CreateUnitCommand): Promise<{ unitId: string }> {
    const shareNum = parseFloat(command.buildingShare);
    if (isNaN(shareNum) || shareNum <= 0) {
      throw new ConflictException('Building share must be greater than 0');
    }

    try {
      const newUnit = await this.unitRepo.create(
        command.tenantId,
        command.unitNo,
        command.buildingShare,
      );

      return { unitId: newUnit.id };
    } catch (error: any) {
      if (error.code === '23505') {
        // Postgres unique constraint violation
        throw new ConflictException(
          `Unit with number ${command.unitNo} already exists in this tenant`,
        );
      }
      throw error;
    }
  }
}
