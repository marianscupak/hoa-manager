import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { UpdateMembershipStatusCommand } from '@/modules/core/tenancy/application/commands/update-membership-status.command';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { MembershipStatusUpdatedAuditEvent } from '@/modules/core/tenancy/audit/events/membership-status-updated.event';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

@CommandHandler(UpdateMembershipStatusCommand)
export class UpdateMembershipStatusHandler
  implements ICommandHandler<UpdateMembershipStatusCommand>
{
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: MembershipRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(command: UpdateMembershipStatusCommand) {
    const existing = await this.membershipRepo.findById(command.membershipId);
    if (!existing) {
      // Unchanged behaviour, stated directly: the previous version called
      // `updateStatus` on an id that matches no row, which does nothing.
      return;
    }

    if (existing.status === command.status) {
      return;
    }

    // No UoW wrapper: this handler is only dispatched from within other
    // UoW-wrapped flows (AcceptOwnerInviteHandler). The repo calls and audit
    // append participate in the outer transaction via DRIZZLE_TX_STORAGE.
    // The tenant comes from the row that was just read, so the write cannot
    // reach past the membership this command actually found.
    const result = await this.membershipRepo.updateStatus(
      existing.tenantId,
      command.membershipId,
      command.status,
    );

    const actor = this.auditContext.requireActor();
    const memberLabel = await this.labelResolver.resolveUserLabel(
      existing.userId,
    );
    const actorLabel = await this.labelResolver.resolveActorLabel(actor);

    await this.auditService.append(
      MembershipStatusUpdatedAuditEvent.build({
        tenantId: existing.tenantId,
        membershipId: existing.id,
        userId: existing.userId,
        previousStatus: existing.status,
        newStatus: command.status,
        actor,
        memberNameLabel: memberLabel,
        changedByLabel: actorLabel,
        occurredAt: this.clock.now(),
      }),
    );

    return result;
  }
}
