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
import {
  InvalidOwnershipShareException,
  InvalidOwnershipSumException,
  OwnerNotFoundException,
  UnitNotFoundException,
} from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

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
    const { tenantId, unitId, ownerships } = command;

    // 1. Verify unit exists in tenant
    const unit = await this.unitRepo.findById(tenantId, unitId);
    if (!unit) {
      throw new UnitNotFoundException();
    }

    // 2. Verify all ownerIds exist in tenant
    for (const ownership of ownerships) {
      const ownerExists = await this.ownerRepo.existsById(
        tenantId,
        ownership.ownerId,
      );
      if (!ownerExists) {
        throw new OwnerNotFoundException();
      }
    }

    // 3. Validate shares
    let totalShare = 0;
    for (const ownership of ownerships) {
      const shareNum = parseFloat(ownership.share);
      if (isNaN(shareNum) || shareNum <= 0) {
        throw new InvalidOwnershipShareException();
      }
      totalShare += shareNum;
    }

    // Check sum(shares) == 1 with tolerance
    if (Math.abs(totalShare - 1.0) > 0.000001) {
      throw new InvalidOwnershipSumException();
    }

    // 4. Transaction: close active rows and insert new ones
    await this.unitOfWork.execute(async () => {
      const now = this.clock.now();

      // Close existing active rows
      await this.ownershipRepo.closeActiveByUnit(tenantId, unitId, now);

      // Insert new rows
      await this.ownershipRepo.createMany(tenantId, unitId, ownerships, now);

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);
      const unitLabel = await this.labelResolver.resolveUnitLabel(unitId);
      const ownerLabels = await Promise.all(
        ownerships.map((o) => this.labelResolver.resolveOwnerLabel(o.ownerId)),
      );

      await this.auditService.append(
        UnitOwnershipReplacedAuditEvent.build({
          tenantId,
          unitId,
          ownerships: ownerships.map((o) => ({
            ownerId: o.ownerId,
            share: o.share,
          })),
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
