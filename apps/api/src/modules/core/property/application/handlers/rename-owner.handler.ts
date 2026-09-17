import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { RenameOwnerCommand } from '@/modules/core/property/application/commands/rename-owner.command';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { OwnerRenamedAuditEvent } from '@/modules/core/property/audit/events/owner-renamed.event';
import {
  OwnerNameRequiredException,
  OwnerNotFoundException,
} from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

@CommandHandler(RenameOwnerCommand)
export class RenameOwnerHandler
  implements ICommandHandler<RenameOwnerCommand, void>
{
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    @Inject(UNIT_OF_WORK)
    private readonly uow: UnitOfWork,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(command: RenameOwnerCommand): Promise<void> {
    const displayName = command.displayName.trim();
    if (displayName.length === 0) {
      throw new OwnerNameRequiredException();
    }

    const owner = await this.ownerRepo.findById(
      command.tenantId,
      command.ownerId,
    );
    if (!owner) {
      throw new OwnerNotFoundException();
    }

    // A rename that changes nothing would still write an audit entry saying
    // the name changed, which is worse than doing nothing at all.
    if (owner.displayName === displayName) return;

    await this.uow.execute(async () => {
      await this.ownerRepo.setDisplayName(
        command.tenantId,
        command.ownerId,
        displayName,
      );

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        OwnerRenamedAuditEvent.build({
          tenantId: command.tenantId,
          ownerId: command.ownerId,
          previousName: owner.displayName,
          ownerName: displayName,
          actor,
          renamedByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
