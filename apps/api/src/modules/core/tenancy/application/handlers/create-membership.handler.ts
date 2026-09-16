import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { CreateMembershipCommand } from '@/modules/core/tenancy/application/commands/create-membership.command';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { MembershipCreatedAuditEvent } from '@/modules/core/tenancy/audit/events/membership-created.event';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

@CommandHandler(CreateMembershipCommand)
export class CreateMembershipHandler implements ICommandHandler<CreateMembershipCommand> {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: MembershipRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(command: CreateMembershipCommand) {
    // No UoW wrapper: this handler is dispatched from within outer UoW-wrapped
    // flows (AcceptOwnerInviteHandler, RegisterFromInviteHandler). Repo write
    // and audit append participate in the outer transaction via
    // DRIZZLE_TX_STORAGE.
    const membership = await this.membershipRepo.create({
      tenantId: command.tenantId,
      userId: command.userId,
      role: command.role,
      status: command.status,
    });

    const actor = this.auditContext.requireActor();
    const memberLabel = await this.labelResolver.resolveUserLabel(
      command.userId,
    );
    const actorLabel = await this.labelResolver.resolveActorLabel(actor);

    await this.auditService.append(
      MembershipCreatedAuditEvent.build({
        tenantId: command.tenantId,
        membershipId: membership.id,
        userId: command.userId,
        role: command.role,
        status: command.status,
        actor,
        memberNameLabel: memberLabel,
        addedByLabel: actorLabel,
        occurredAt: this.clock.now(),
      }),
    );

    return membership;
  }
}
