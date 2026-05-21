import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { SetOwnerUserIdCommand } from '@/modules/core/property/application/commands/set-owner-user-id.command';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { OwnerUserLinkedAuditEvent } from '@/modules/core/property/audit/events/owner-user-linked.event';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

@CommandHandler(SetOwnerUserIdCommand)
export class SetOwnerUserIdHandler
  implements ICommandHandler<SetOwnerUserIdCommand>
{
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(command: SetOwnerUserIdCommand): Promise<void> {
    // No UoW wrapper: this handler is dispatched only from within other
    // UoW-wrapped flows (AcceptOwnerInviteHandler, RegisterFromInviteHandler).
    // Repo write and audit append participate in the outer transaction via
    // DRIZZLE_TX_STORAGE.
    await this.ownerRepo.setUserId(
      command.tenantId,
      command.ownerId,
      command.userId,
    );

    const actor = this.auditContext.requireActor();
    const actorLabel = await this.labelResolver.resolveActorLabel(actor);
    const ownerLabel = await this.labelResolver.resolveOwnerLabel(command.ownerId);
    const userLabel = await this.labelResolver.resolveUserLabel(command.userId);

    await this.auditService.append(
      OwnerUserLinkedAuditEvent.build({
        tenantId: command.tenantId,
        ownerId: command.ownerId,
        userId: command.userId,
        source: command.source,
        actor,
        ownerLabel,
        userLabel,
        linkedByLabel: actorLabel,
        occurredAt: this.clock.now(),
      }),
    );
  }
}
