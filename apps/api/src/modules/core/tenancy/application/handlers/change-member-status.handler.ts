import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { ChangeMemberStatusCommand } from '@/modules/core/tenancy/application/commands/change-member-status.command';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { MembershipStatusUpdatedAuditEvent } from '@/modules/core/tenancy/audit/events/membership-status-updated.event';
import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';
import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

/**
 * Suspends a member or lets them back in. A suspended membership keeps its
 * role and history; `TenantContextGuard` simply stops admitting it, on the
 * very next request, because it reads the status from the database each time.
 *
 * Unlike `UpdateMembershipStatusHandler`, which only runs inside the invite
 * flow, this one is reachable from the API, so it checks that the membership
 * belongs to the caller's association.
 */
@CommandHandler(ChangeMemberStatusCommand)
export class ChangeMemberStatusHandler
  implements ICommandHandler<ChangeMemberStatusCommand>
{
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
    @Inject(UNIT_OF_WORK)
    private readonly uow: UnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(command: ChangeMemberStatusCommand): Promise<void> {
    const membership = await this.membershipRepository.findById(
      command.membershipId,
    );

    if (!membership || membership.tenantId !== command.tenantId) {
      throw new DomainException(ErrorCode.MEMBERSHIP_NOT_FOUND);
    }

    if (membership.status === command.status) {
      return;
    }

    if (membership.id === command.actorMembershipId) {
      throw new DomainException(ErrorCode.CANNOT_CHANGE_OWN_MEMBERSHIP_STATUS);
    }

    if (
      command.status === TenantMembershipStatus.SUSPENDED &&
      membership.role === TenantMembershipRole.ADMIN
    ) {
      const members = await this.membershipRepository.listByTenant(
        command.tenantId,
      );
      const activeAdmins = members.filter(
        (m) =>
          m.role === TenantMembershipRole.ADMIN &&
          m.status === TenantMembershipStatus.ACTIVE,
      );

      if (activeAdmins.length <= 1) {
        throw new DomainException(ErrorCode.LAST_ADMIN_CANNOT_BE_REMOVED);
      }
    }

    const previousStatus = membership.status;

    await this.uow.execute(async () => {
      await this.membershipRepository.updateStatus(
        command.tenantId,
        command.membershipId,
        command.status,
      );

      const actor = this.auditContext.requireActor();
      const memberLabel = await this.labelResolver.resolveUserLabel(
        membership.userId,
      );
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        MembershipStatusUpdatedAuditEvent.build({
          tenantId: command.tenantId,
          membershipId: command.membershipId,
          userId: membership.userId,
          previousStatus,
          newStatus: command.status,
          actor,
          memberNameLabel: memberLabel,
          changedByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
