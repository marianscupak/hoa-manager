import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { CreateUnitCommand } from '@/modules/core/property/application/commands/create-unit.command';
import {
  UNIT_REPOSITORY,
  type UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { UnitCreatedAuditEvent } from '@/modules/core/property/audit/events/unit-created.event';
import {
  DuplicateUnitNumberException,
  InvalidOwnershipShareException,
} from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

@CommandHandler(CreateUnitCommand)
export class CreateUnitHandler
  implements ICommandHandler<CreateUnitCommand, { unitId: string }>
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

  async execute(command: CreateUnitCommand): Promise<{ unitId: string }> {
    if (
      !Number.isInteger(command.buildingShareNumerator) ||
      !Number.isInteger(command.buildingShareDenominator) ||
      command.buildingShareNumerator <= 0 ||
      command.buildingShareDenominator <= 0
    ) {
      throw new InvalidOwnershipShareException();
    }

    return this.uow.execute(async () => {
      let newUnit;
      try {
        newUnit = await this.unitRepo.create(command.tenantId, {
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
        UnitCreatedAuditEvent.build({
          tenantId: command.tenantId,
          unitId: newUnit.id,
          unitNo: command.unitNo,
          buildingShareNumerator: command.buildingShareNumerator,
          buildingShareDenominator: command.buildingShareDenominator,
          actor,
          createdByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );

      return { unitId: newUnit.id };
    });
  }
}
