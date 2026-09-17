import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { UpdateOwnershipPeriodCommand } from '@/modules/core/property/application/commands/update-ownership-period.command';
import {
  OWNERSHIP_VOTE_LOOKUP,
  type OwnershipVoteLookup,
} from '@/modules/core/property/application/ports/ownership-vote-lookup.port';
import {
  UNIT_OWNERSHIP_REPOSITORY,
  type UnitOwnershipRepository,
  UNIT_REPOSITORY,
  type UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { OwnershipPeriodUpdatedAuditEvent } from '@/modules/core/property/audit/events/ownership-period-updated.event';
import {
  classifyVotesInRange,
  validatePeriodBounds,
} from '@/modules/core/property/domain/ownership-period-bounds';
import {
  OwnershipPeriodAffectsVotesException,
  OwnershipPeriodEndBeforeStartException,
  OwnershipPeriodNotFoundException,
  OwnershipPeriodOverlapsException,
  UnitNotFoundException,
} from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

/** The span a move reaches: everything between the old and the new bounds. */
function affectedRange(
  before: { validFrom: Date; validTo: Date | null },
  after: { validFrom: Date; validTo: Date | null },
): { from: Date; to: Date | null } {
  const from = new Date(
    Math.min(before.validFrom.getTime(), after.validFrom.getTime()),
  );
  const to =
    before.validTo === null || after.validTo === null
      ? null
      : new Date(Math.max(before.validTo.getTime(), after.validTo.getTime()));
  return { from, to };
}

@CommandHandler(UpdateOwnershipPeriodCommand)
export class UpdateOwnershipPeriodHandler
  implements ICommandHandler<UpdateOwnershipPeriodCommand, void>
{
  constructor(
    @Inject(UNIT_OWNERSHIP_REPOSITORY)
    private readonly ownershipRepo: UnitOwnershipRepository,
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepo: UnitRepository,
    @Inject(OWNERSHIP_VOTE_LOOKUP)
    private readonly voteLookup: OwnershipVoteLookup,
    @Inject(CLOCK)
    private readonly clock: Clock,
    @Inject(UNIT_OF_WORK)
    private readonly uow: UnitOfWork,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(command: UpdateOwnershipPeriodCommand): Promise<void> {
    const unit = await this.unitRepo.findById(command.tenantId, command.unitId);
    if (!unit) throw new UnitNotFoundException();

    const parties = await this.ownershipRepo.listByUnit(
      command.tenantId,
      command.unitId,
    );

    const target = parties.filter(
      (p) => p.validFrom.getTime() === command.periodValidFrom.getTime(),
    );
    if (target.length === 0) throw new OwnershipPeriodNotFoundException();

    const others = parties
      .filter(
        (p) => p.validFrom.getTime() !== command.periodValidFrom.getTime(),
      )
      .map((p) => ({ validFrom: p.validFrom, validTo: p.validTo }));

    const next = { validFrom: command.validFrom, validTo: command.validTo };
    const issue = validatePeriodBounds(next, others);
    if (issue === 'END_BEFORE_START') {
      throw new OwnershipPeriodEndBeforeStartException();
    }
    if (issue === 'OVERLAPS_ANOTHER_PERIOD') {
      throw new OwnershipPeriodOverlapsException();
    }

    const before = {
      validFrom: target[0].validFrom,
      validTo: target[0].validTo,
    };
    const votes = classifyVotesInRange(
      affectedRange(before, next),
      await this.voteLookup.findVotes(command.tenantId),
    );
    if (votes.length > 0 && !command.acknowledged) {
      throw new OwnershipPeriodAffectsVotesException(votes);
    }

    await this.uow.execute(async () => {
      await this.ownershipRepo.setPeriodBounds(
        command.tenantId,
        target.map((p) => p.id),
        next.validFrom,
        next.validTo,
      );

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        OwnershipPeriodUpdatedAuditEvent.build({
          tenantId: command.tenantId,
          unitId: command.unitId,
          unitLabel: unit.unitNo,
          previousValidFrom: before.validFrom,
          previousValidTo: before.validTo,
          validFrom: next.validFrom,
          validTo: next.validTo,
          affectedVoteCount: votes.length,
          actor,
          changedByLabel: actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
