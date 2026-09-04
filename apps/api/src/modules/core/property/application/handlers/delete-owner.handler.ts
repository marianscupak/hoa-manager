import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { DeleteOwnerCommand } from '@/modules/core/property/application/commands/delete-owner.command';
import {
  OWNER_REPOSITORY,
  UNIT_OWNERSHIP_REPOSITORY,
  type OwnerRepository,
  type UnitOwnershipRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { OwnerDeletedAuditEvent } from '@/modules/core/property/audit/events/owner-deleted.event';
import {
  OwnerHasOwnershipRecordsException,
  OwnerNotFoundException,
} from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

@CommandHandler(DeleteOwnerCommand)
export class DeleteOwnerHandler implements ICommandHandler<DeleteOwnerCommand> {
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepository: OwnerRepository,
    @Inject(UNIT_OWNERSHIP_REPOSITORY)
    private readonly ownershipRepository: UnitOwnershipRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly uow: DrizzleUnitOfWork,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(command: DeleteOwnerCommand): Promise<void> {
    const existing = await this.ownerRepository.findById(
      command.tenantId,
      command.ownerId,
    );
    if (!existing) {
      throw new OwnerNotFoundException();
    }

    // Ownership history must survive: an owner who ever held a unit stays.
    const referenced = await this.ownershipRepository.existsMemberRowForOwner(
      command.tenantId,
      command.ownerId,
    );
    if (referenced) {
      throw new OwnerHasOwnershipRecordsException();
    }

    await this.uow.execute(async () => {
      await this.ownerRepository.delete(command.tenantId, command.ownerId);

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        OwnerDeletedAuditEvent.build({
          tenantId: command.tenantId,
          ownerId: command.ownerId,
          ownerName: existing.displayName,
          actor,
          deletedByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
