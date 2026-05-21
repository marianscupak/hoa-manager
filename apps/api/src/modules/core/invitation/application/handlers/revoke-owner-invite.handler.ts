import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { RevokeOwnerInviteCommand } from '@/modules/core/invitation/application/commands/revoke-owner-invite.command';
import {
  OWNER_INVITE_REPOSITORY,
  type OwnerInviteRepository,
} from '@/modules/core/invitation/application/ports/owner-invite.repository.port';
import { OwnerInviteRevokedAuditEvent } from '@/modules/core/invitation/audit/events/owner-invite-revoked.event';
import {
  InviteNotFoundException,
  InviteAlreadyAcceptedException,
} from '@/shared/application/exceptions/invite.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

@CommandHandler(RevokeOwnerInviteCommand)
export class RevokeOwnerInviteHandler
  implements ICommandHandler<RevokeOwnerInviteCommand>
{
  constructor(
    @Inject(OWNER_INVITE_REPOSITORY)
    private readonly inviteRepo: OwnerInviteRepository,
    @Inject(UNIT_OF_WORK)
    private readonly uow: UnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(command: RevokeOwnerInviteCommand): Promise<void> {
    const invite = await this.inviteRepo.findPendingByOwnerId(
      command.tenantId,
      command.ownerId,
    );

    if (!invite) {
      throw new InviteNotFoundException();
    }

    if (invite.acceptedAt) {
      throw new InviteAlreadyAcceptedException();
    }

    await this.uow.execute(async () => {
      await this.inviteRepo.deleteByOwnerId(command.tenantId, command.ownerId);

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);
      const ownerLabel = await this.labelResolver.resolveOwnerLabel(
        command.ownerId,
      );

      await this.auditService.append(
        OwnerInviteRevokedAuditEvent.build({
          tenantId: command.tenantId,
          ownerId: command.ownerId,
          inviteId: invite.id,
          actor,
          ownerLabel,
          revokedByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
