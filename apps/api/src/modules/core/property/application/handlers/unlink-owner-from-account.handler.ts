import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { OwnerUserUnlinkedAuditEvent } from '@/modules/core/property/audit/events/owner-user-unlinked.event';
import {
  OwnerNotFoundException,
  OwnerNotLinkedException,
} from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

import { UnlinkOwnerFromAccountCommand } from '../commands/unlink-owner-from-account.command';

/**
 * Detaches a user account from an owner record.
 *
 * The counterpart of linking exists because the link governs who may vote for
 * that owner's units: a one-way action would make a mistyped link unfixable,
 * and nobody would notice until a vote had been cast by the wrong person.
 */
@CommandHandler(UnlinkOwnerFromAccountCommand)
export class UnlinkOwnerFromAccountHandler implements ICommandHandler<UnlinkOwnerFromAccountCommand> {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(OWNER_REPOSITORY) private readonly ownerRepo: OwnerRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(command: UnlinkOwnerFromAccountCommand): Promise<void> {
    const { tenantId, ownerId } = command;

    await this.uow.execute(async () => {
      const owner = await this.ownerRepo.findById(tenantId, ownerId);
      if (!owner) {
        throw new OwnerNotFoundException();
      }
      if (!owner.userId) {
        throw new OwnerNotLinkedException();
      }

      // Read before the write: the label resolver would find nothing to
      // resolve once the link is gone.
      const actor = this.auditContext.requireActor();
      const [actorLabel, ownerLabel, userLabel] = await Promise.all([
        this.labelResolver.resolveActorLabel(actor),
        this.labelResolver.resolveOwnerLabel(ownerId),
        this.labelResolver.resolveUserLabel(owner.userId),
      ]);

      await this.ownerRepo.clearUserId(tenantId, ownerId);

      await this.auditService.append(
        OwnerUserUnlinkedAuditEvent.build({
          tenantId,
          ownerId,
          userId: owner.userId,
          actor,
          ownerLabel,
          userLabel,
          unlinkedByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
