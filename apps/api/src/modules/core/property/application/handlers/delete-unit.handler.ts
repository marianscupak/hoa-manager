import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { DeleteUnitCommand } from '@/modules/core/property/application/commands/delete-unit.command';
import {
  UNIT_REPOSITORY,
  type UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { UnitDeletedAuditEvent } from '@/modules/core/property/audit/events/unit-deleted.event';
import { UnitNotFoundException } from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

@CommandHandler(DeleteUnitCommand)
export class DeleteUnitHandler implements ICommandHandler<DeleteUnitCommand> {
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepository: UnitRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly uow: DrizzleUnitOfWork,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(command: DeleteUnitCommand): Promise<void> {
    const existing = await this.unitRepository.findById(
      command.tenantId,
      command.unitId,
    );
    if (!existing) {
      throw new UnitNotFoundException();
    }

    await this.uow.execute(async () => {
      await this.unitRepository.delete(command.tenantId, command.unitId);

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        UnitDeletedAuditEvent.build({
          tenantId: command.tenantId,
          unitId: command.unitId,
          unitNo: existing.unitNo,
          actor,
          deletedByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
