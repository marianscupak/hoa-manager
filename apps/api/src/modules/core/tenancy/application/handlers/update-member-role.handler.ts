import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { UpdateMemberRoleCommand } from '@/modules/core/tenancy/application/commands/update-member-role.command';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { MembershipRoleUpdatedAuditEvent } from '@/modules/core/tenancy/audit/events/membership-role-updated.event';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';
import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

@CommandHandler(UpdateMemberRoleCommand)
export class UpdateMemberRoleHandler
  implements ICommandHandler<UpdateMemberRoleCommand>
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

  async execute(command: UpdateMemberRoleCommand): Promise<void> {
    const membership = await this.membershipRepository.findById(
      command.membershipId,
    );

    if (!membership || membership.tenantId !== command.tenantId) {
      throw new DomainException(ErrorCode.MEMBERSHIP_NOT_FOUND);
    }

    if (membership.role === command.role) {
      return;
    }

    if (
      membership.role === TenantMembershipRole.ADMIN &&
      command.role !== TenantMembershipRole.ADMIN
    ) {
      const members = await this.membershipRepository.listByTenant(
        command.tenantId,
      );
      const admins = members.filter(
        (m) => m.role === TenantMembershipRole.ADMIN,
      );

      if (admins.length <= 1) {
        throw new DomainException(ErrorCode.LAST_ADMIN_CANNOT_BE_REMOVED);
      }
    }

    const previousRole = membership.role;

    await this.uow.execute(async () => {
      await this.membershipRepository.updateRole(
        command.tenantId,
        command.membershipId,
        command.role,
      );

      const actor = this.auditContext.requireActor();
      const memberLabel = await this.labelResolver.resolveUserLabel(
        membership.userId,
      );
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        MembershipRoleUpdatedAuditEvent.build({
          tenantId: command.tenantId,
          membershipId: command.membershipId,
          userId: membership.userId,
          previousRole,
          newRole: command.role,
          actor,
          memberNameLabel: memberLabel,
          changedByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
