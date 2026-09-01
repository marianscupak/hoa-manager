import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { VoteElectorateSnapshottedAuditEvent } from '@/modules/voting/audit/events/vote-electorate-snapshotted.event';
import { VoteOpenedAuditEvent } from '@/modules/voting/audit/events/vote-opened.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteWeightBasis } from '@/modules/voting/domain/vote/vote.types';
import {
  VoteBuildingSharesIncompleteException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
import {
  type UnitOfWork,
  UNIT_OF_WORK,
} from '@/shared/application/ports/unit-of-work.port';
import { Rational } from '@/shared/domain/rational';

import { OpenVoteCommand } from './open-vote.command';
import {
  ELECTORATE_DATA_REPOSITORY,
  type ElectorateDataRepository,
} from '../../ports/electorate-data.repository.port';
import {
  ELECTORATE_SERVICE,
  type ElectorateService,
} from '../../ports/electorate-service.port';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '../../ports/vote-write.repository.port';

@CommandHandler(OpenVoteCommand)
export class OpenVoteCommandHandler
  implements ICommandHandler<OpenVoteCommand>
{
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    @Inject(ELECTORATE_SERVICE)
    private readonly electorateService: ElectorateService,
    @Inject(ELECTORATE_DATA_REPOSITORY)
    private readonly electorateDataRepository: ElectorateDataRepository,
    @Inject(UNIT_OF_WORK)
    private readonly uow: UnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
  ) {}

  async execute(command: OpenVoteCommand): Promise<void> {
    const { tenantId, voteId, openedByMembershipId } = command;

    await this.uow.execute(async () => {
      const vote = await this.voteRepository.findById(tenantId, voteId);
      if (!vote) {
        throw new VoteNotFoundException();
      }

      vote.open(openedByMembershipId, this.clock.now());

      // Share-weighted votes need a complete building-share plan; a partial
      // plan would silently shrink every denominator (DOM-009).
      if (vote.ruleset?.weightBasis === VoteWeightBasis.UNIT_SHARE) {
        const units =
          await this.electorateDataRepository.findAllUnits(tenantId);
        const total = Rational.sum(
          units.map((u) =>
            Rational.from(u.buildingShareNumerator, u.buildingShareDenominator),
          ),
        );
        if (!total.eq(Rational.one())) {
          throw new VoteBuildingSharesIncompleteException(
            `${total.num}/${total.den}`,
          );
        }
      }

      const electorate = await this.electorateService.resolveElectorate(vote);

      await this.voteRepository.save(vote);
      await this.voteRepository.saveElectorateUnits(
        tenantId,
        voteId,
        electorate,
      );

      const actor = this.auditContext.requireActor();
      const openedByLabel = await this.labelResolver.resolveActorLabel(actor);

      const openedAt = this.clock.now();
      const totalWeight = Rational.sum(
        electorate.map((u) => Rational.from(u.weightNum, u.weightDen)),
      );

      await this.auditService.append(
        VoteOpenedAuditEvent.build({
          voteId: vote.id,
          tenantId: vote.tenantId,
          voteTitle: vote.title,
          actor,
          openedByLabel,
          electorateSize: electorate.length,
          openedAt,
        }),
      );

      await this.auditService.append(
        VoteElectorateSnapshottedAuditEvent.build({
          voteId: vote.id,
          tenantId: vote.tenantId,
          voteTitle: vote.title,
          actor,
          totalUnits: electorate.length,
          totalWeight: `${totalWeight.num}/${totalWeight.den}`,
          occurredAt: openedAt,
        }),
      );
    });
  }
}
