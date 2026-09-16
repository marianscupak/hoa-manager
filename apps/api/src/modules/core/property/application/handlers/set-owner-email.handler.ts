import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { SetOwnerEmailCommand } from '@/modules/core/property/application/commands/set-owner-email.command';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { OwnerEmailAddedAuditEvent } from '@/modules/core/property/audit/events/owner-email-added.event';
import {
  DuplicateOwnerEmailException,
  OwnerEmailAlreadySetException,
  OwnerNotFoundException,
} from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';
import { normalizeEmail } from '@/shared/application/utils/normalize-email';

@CommandHandler(SetOwnerEmailCommand)
export class SetOwnerEmailHandler
  implements ICommandHandler<SetOwnerEmailCommand, void>
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

  async execute(command: SetOwnerEmailCommand): Promise<void> {
    const email = normalizeEmail(command.email);

    const owner = await this.ownerRepo.findById(
      command.tenantId,
      command.ownerId,
    );
    if (!owner) {
      throw new OwnerNotFoundException();
    }
    if (owner.email) {
      throw new OwnerEmailAlreadySetException();
    }

    const existing = await this.ownerRepo.findByEmail(command.tenantId, email);
    if (existing) {
      throw new DuplicateOwnerEmailException();
    }

    await this.uow.execute(async () => {
      await this.ownerRepo.setEmail(command.tenantId, command.ownerId, email);

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        OwnerEmailAddedAuditEvent.build({
          tenantId: command.tenantId,
          ownerId: command.ownerId,
          ownerName: owner.displayName,
          actor,
          addedByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
