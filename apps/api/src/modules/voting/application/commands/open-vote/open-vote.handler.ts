import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { VoteElectorateSnapshottedAuditEvent } from '@/modules/voting/audit/events/vote-electorate-snapshotted.event';
import { VoteOpenedAuditEvent } from '@/modules/voting/audit/events/vote-opened.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
import {
  type UnitOfWork,
  UNIT_OF_WORK,
} from '@/shared/application/ports/unit-of-work.port';

import { OpenVoteCommand } from './open-vote.command';
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
      const totalWeight = electorate.reduce(
        (sum, u) => sum + u.votingWeight,
        0,
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
          totalWeight,
          occurredAt: openedAt,
        }),
      );
    });
  }
}
