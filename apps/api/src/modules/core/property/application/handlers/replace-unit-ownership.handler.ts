import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { ReplaceUnitOwnershipCommand } from '@/modules/core/property/application/commands/replace-unit-ownership.command';
import {
  OWNER_REPOSITORY,
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
  type OwnerRepository,
  type UnitOwnershipRepository,
  type UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { UnitOwnershipReplacedAuditEvent } from '@/modules/core/property/audit/events/unit-ownership-replaced.event';
import { validateOwnershipPlan } from '@/modules/core/property/domain/ownership-plan';
import type { OwnerRef } from '@/modules/core/property/domain/ownership-plan';
import { planOwnershipTransition } from '@/modules/core/property/domain/ownership-transition';
import {
  InvalidOwnershipShareException,
  InvalidOwnershipSumException,
  OwnerNotFoundException,
  OwnershipDuplicateOwnerException,
  OwnershipEffectiveDateTooEarlyException,
  OwnershipMixedAssociationUnsupportedException,
  OwnershipSjmMembersInvalidException,
  OwnershipTransferAlreadyScheduledException,
  UnitNotFoundException,
} from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import { formatAssociationDate } from '@/shared/domain/association-date';

@CommandHandler(ReplaceUnitOwnershipCommand)
export class ReplaceUnitOwnershipHandler
  implements ICommandHandler<ReplaceUnitOwnershipCommand, void>
{
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepo: UnitRepository,
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
    @Inject(UNIT_OWNERSHIP_REPOSITORY)
    private readonly ownershipRepo: UnitOwnershipRepository,
    private readonly unitOfWork: DrizzleUnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(command: ReplaceUnitOwnershipCommand): Promise<void> {
    const { tenantId, unitId, ownerships, effectiveAt } = command;

    const unit = await this.unitRepo.findById(tenantId, unitId);
    if (!unit) throw new UnitNotFoundException();

    const tenantOwners = await this.ownerRepo.listByTenant(tenantId);
    const ownerMap = new Map<string, OwnerRef>(
      tenantOwners.map((o) => [o.id, { id: o.id, kind: o.kind }]),
    );

    const errors = validateOwnershipPlan(ownerships, ownerMap);
    if (errors.length > 0) {
      const first = errors[0];
      switch (first.code) {
        case 'UNKNOWN_OWNER':
          throw new OwnerNotFoundException();
        case 'INVALID_SHARE':
          throw new InvalidOwnershipShareException();
        case 'SUM_NOT_ONE':
          throw new InvalidOwnershipSumException(
            `${first.actual.num}/${first.actual.den}`,
          );
        case 'SOLE_MEMBER_COUNT':
        case 'SJM_MEMBER_RULES':
          throw new OwnershipSjmMembersInvalidException();
        case 'DUPLICATE_OWNER':
          throw new OwnershipDuplicateOwnerException();
        case 'MIXED_ASSOCIATION':
          throw new OwnershipMixedAssociationUnsupportedException();
      }
    }

    const now = this.clock.now();
    const existing = await this.ownershipRepo.listByUnit(tenantId, unitId);
    const plan = planOwnershipTransition(existing, effectiveAt, now);
    if (plan.kind === 'REJECT') {
      throw plan.code === 'TRANSFER_ALREADY_SCHEDULED'
        ? new OwnershipTransferAlreadyScheduledException()
        : new OwnershipEffectiveDateTooEarlyException();
    }

    await this.unitOfWork.execute(async () => {
      if (plan.deletePartyIds.length > 0) {
        await this.ownershipRepo.deleteParties(tenantId, plan.deletePartyIds);
      }
      if (plan.closePartyIds.length > 0) {
        await this.ownershipRepo.closeParties(
          tenantId,
          plan.closePartyIds,
          effectiveAt,
        );
      }
      await this.ownershipRepo.createMany(
        tenantId,
        unitId,
        ownerships,
        effectiveAt,
      );

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);
      const unitLabel = await this.labelResolver.resolveUnitLabel(unitId);
      const ownerLabels = await Promise.all(
        ownerships
          .flatMap((p) => p.memberOwnerIds)
          .map((ownerId) => this.labelResolver.resolveOwnerLabel(ownerId)),
      );

      await this.auditService.append(
        UnitOwnershipReplacedAuditEvent.build({
          tenantId,
          unitId,
          ownerships: ownerships.map((p) => ({
            partyType: p.partyType,
            share: `${p.shareNumerator}/${p.shareDenominator}`,
            memberOwnerIds: p.memberOwnerIds,
          })),
          effectiveFrom: formatAssociationDate(effectiveAt),
          actor,
          unitLabel,
          changedByLabel: actorLabel,
          ownerLabels,
          occurredAt: now,
        }),
      );
    });
  }
}
