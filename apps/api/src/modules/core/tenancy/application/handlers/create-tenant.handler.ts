import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { CreateTenantCommand } from '@/modules/core/tenancy/application/commands/create-tenant.command';
import {
  MEMBERSHIP_REPOSITORY,
  TENANT_REPOSITORY,
  type MembershipRepository,
  type TenantRepository,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { MembershipCreatedAuditEvent } from '@/modules/core/tenancy/audit/events/membership-created.event';
import { TenantCreatedAuditEvent } from '@/modules/core/tenancy/audit/events/tenant-created.event';
import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler
  implements ICommandHandler<CreateTenantCommand, { tenantId: string }>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
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

  async execute(command: CreateTenantCommand): Promise<{ tenantId: string }> {
    return this.uow.execute(async () => {
      const tenant = await this.tenantRepository.create(command.name);

      const membership = await this.membershipRepository.create({
        tenantId: tenant.id,
        userId: command.createdByUserId,
        role: TenantMembershipRole.ADMIN,
        status: TenantMembershipStatus.ACTIVE,
      });

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);
      const memberLabel = await this.labelResolver.resolveUserLabel(
        command.createdByUserId,
      );

      await this.auditService.append(
        TenantCreatedAuditEvent.build({
          tenantId: tenant.id,
          tenantName: tenant.name,
          actor,
          createdByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );

      await this.auditService.append(
        MembershipCreatedAuditEvent.build({
          tenantId: tenant.id,
          membershipId: membership.id,
          userId: command.createdByUserId,
          role: TenantMembershipRole.ADMIN,
          status: TenantMembershipStatus.ACTIVE,
          actor,
          memberNameLabel: memberLabel,
          addedByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );

      return { tenantId: tenant.id };
    });
  }
}
