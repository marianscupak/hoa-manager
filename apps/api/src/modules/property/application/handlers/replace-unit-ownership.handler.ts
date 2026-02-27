import { Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SystemClock } from '../../../../infrastructure/clock/system-clock';
import { DrizzleUnitOfWork } from '../../../../infrastructure/db/drizzle.unit-of-work';
import { CLOCK } from '../../../../shared/application/ports/clock.port';
import { ReplaceUnitOwnershipCommand } from '../commands/replace-unit-ownership.command';
import {
  OWNER_REPOSITORY,
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
  type OwnerRepository,
  type UnitOwnershipRepository,
  type UnitRepository,
} from '../ports/property.repository.port';

@CommandHandler(ReplaceUnitOwnershipCommand)
export class ReplaceUnitOwnershipHandler
  implements ICommandHandler<ReplaceUnitOwnershipCommand, void>
{
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepo: UnitRepository,
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
    @Inject(UNIT_OWNERSHIP_REPOSITORY)
    private readonly ownershipRepo: UnitOwnershipRepository,
    private readonly unitOfWork: DrizzleUnitOfWork,
    @Inject(CLOCK)
    private readonly clock: SystemClock,
  ) {}

  async execute(command: ReplaceUnitOwnershipCommand): Promise<void> {
    const { tenantId, unitId, ownerships } = command;

    // 1. Verify unit exists in tenant
    const unit = await this.unitRepo.findById(tenantId, unitId);
    if (!unit) {
      throw new NotFoundException(
        `Unit with id ${unitId} not found in this tenant`,
      );
    }

    // 2. Verify all ownerIds exist in tenant
    for (const ownership of ownerships) {
      const ownerExists = await this.ownerRepo.existsById(
        tenantId,
        ownership.ownerId,
      );
      if (!ownerExists) {
        throw new NotFoundException(
          `Owner with id ${ownership.ownerId} not found in this tenant`,
        );
      }
    }

    // 3. Validate shares
    let totalShare = 0;
    for (const ownership of ownerships) {
      const shareNum = parseFloat(ownership.share);
      if (isNaN(shareNum) || shareNum <= 0) {
        throw new ConflictException('Each share must be greater than 0');
      }
      totalShare += shareNum;
    }

    // Check sum(shares) == 1 with tolerance
    if (Math.abs(totalShare - 1.0) > 0.000001) {
      throw new ConflictException(
        `Sum of ownership shares must equal 1.0. Current sum: ${totalShare}`,
      );
    }

    // 4. Transaction: close active rows and insert new ones
    await this.unitOfWork.execute(async () => {
      const now = this.clock.now();

      // Close existing active rows
      await this.ownershipRepo.closeActiveByUnit(tenantId, unitId, now);

      // Insert new rows
      await this.ownershipRepo.createMany(tenantId, unitId, ownerships, now);
    });
  }
}
