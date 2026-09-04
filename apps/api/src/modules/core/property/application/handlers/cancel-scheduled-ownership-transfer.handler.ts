import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { CancelScheduledOwnershipTransferCommand } from '@/modules/core/property/application/commands/cancel-scheduled-ownership-transfer.command';
import {
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
  type UnitOwnershipRepository,
  type UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { UnitOwnershipTransferCancelledAuditEvent } from '@/modules/core/property/audit/events/unit-ownership-transfer-cancelled.event';
import { scheduledParties } from '@/modules/core/property/domain/ownership-periods';
import {
  OwnershipNoScheduledTransferException,
  UnitNotFoundException,
} from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import { formatAssociationDate } from '@/shared/domain/association-date';

/**
 * Removes the unit's scheduled period (spec §4.2): the future-dated parties
 * are deleted and the period that was going to end at that date is reopened
 * (`valid_to` back to NULL), so the history reads as if nothing had been
 * scheduled. The audit log keeps the record.
 */
@CommandHandler(CancelScheduledOwnershipTransferCommand)
export class CancelScheduledOwnershipTransferHandler
  implements ICommandHandler<CancelScheduledOwnershipTransferCommand, void>
{
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepo: UnitRepository,
    @Inject(UNIT_OWNERSHIP_REPOSITORY)
    private readonly ownershipRepo: UnitOwnershipRepository,
    private readonly unitOfWork: DrizzleUnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(
    command: CancelScheduledOwnershipTransferCommand,
  ): Promise<void> {
    const { tenantId, unitId } = command;

    const unit = await this.unitRepo.findById(tenantId, unitId);
    if (!unit) throw new UnitNotFoundException();

    await this.unitOfWork.execute(async () => {
      await this.unitRepo.lockForUpdate(tenantId, unitId);

      const now = this.clock.now();
      const parties = await this.ownershipRepo.listByUnit(tenantId, unitId);
      const scheduled = scheduledParties(parties, now).sort(
        (a, b) => a.validFrom.getTime() - b.validFrom.getTime(),
      );
      if (scheduled.length === 0) {
        throw new OwnershipNoScheduledTransferException();
      }

      const scheduledStarts = new Set(
        scheduled.map((p) => p.validFrom.getTime()),
      );
      const toReopen = parties
        .filter(
          (p) => p.validTo !== null && scheduledStarts.has(p.validTo.getTime()),
        )
        .map((p) => p.id);

      await this.ownershipRepo.deleteParties(
        tenantId,
        scheduled.map((p) => p.id),
      );
      await this.ownershipRepo.reopenParties(tenantId, toReopen);

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);
      const unitLabel = await this.labelResolver.resolveUnitLabel(unitId);
      const ownerLabels = await Promise.all(
        scheduled
          .flatMap((p) => p.memberOwnerIds)
          .map((ownerId) => this.labelResolver.resolveOwnerLabel(ownerId)),
      );

      await this.auditService.append(
        UnitOwnershipTransferCancelledAuditEvent.build({
          tenantId,
          unitId,
          effectiveFrom: formatAssociationDate(scheduled[0].validFrom),
          ownerships: scheduled.map((p) => ({
            partyType: p.partyType,
            share: `${p.shareNumerator}/${p.shareDenominator}`,
            memberOwnerIds: p.memberOwnerIds,
          })),
          actor,
          unitLabel,
          cancelledByLabel: actorLabel,
          ownerLabels,
          occurredAt: now,
        }),
      );
    });
  }
}
