import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { UpdateUnitCommand } from '@/modules/core/property/application/commands/update-unit.command';
import {
  UNIT_REPOSITORY,
  type UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { UnitUpdatedAuditEvent } from '@/modules/core/property/audit/events/unit-updated.event';
import {
  DuplicateUnitNumberException,
  InvalidOwnershipShareException,
  UnitNotFoundException,
} from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

@CommandHandler(UpdateUnitCommand)
export class UpdateUnitHandler
  implements ICommandHandler<UpdateUnitCommand, void>
{
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepo: UnitRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly uow: DrizzleUnitOfWork,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
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

    const unchanged =
      existing.unitNo === command.unitNo &&
      existing.buildingShareNumerator === command.buildingShareNumerator &&
      existing.buildingShareDenominator === command.buildingShareDenominator;

    if (unchanged) {
      return;
    }

    await this.uow.execute(async () => {
      try {
        await this.unitRepo.update(command.tenantId, command.unitId, {
          unitNo: command.unitNo,
          buildingShareNumerator: command.buildingShareNumerator,
          buildingShareDenominator: command.buildingShareDenominator,
        });
      } catch (error: any) {
        if (error.code === '23505') {
          throw new DuplicateUnitNumberException();
        }
        throw error;
      }

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        UnitUpdatedAuditEvent.build({
          tenantId: command.tenantId,
          unitId: command.unitId,
          previous: {
            unitNo: existing.unitNo,
            buildingShareNumerator: existing.buildingShareNumerator,
            buildingShareDenominator: existing.buildingShareDenominator,
          },
          next: {
            unitNo: command.unitNo,
            buildingShareNumerator: command.buildingShareNumerator,
            buildingShareDenominator: command.buildingShareDenominator,
          },
          actor,
          updatedByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
