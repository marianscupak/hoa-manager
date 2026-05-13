import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { VoteClosedAuditEvent } from '@/modules/voting/audit/events/vote-closed.event';
import { VoteResultsComputedAuditEvent } from '@/modules/voting/audit/events/vote-results-computed.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
import {
  type UnitOfWork,
  UNIT_OF_WORK,
} from '@/shared/application/ports/unit-of-work.port';

import { CloseVoteCommand } from './close-vote.command';
import {
  RESULT_CALCULATION_SERVICE,
  type ResultCalculationService,
} from '../../ports/result-calculation.service.port';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '../../ports/vote-write.repository.port';

@CommandHandler(CloseVoteCommand)
export class CloseVoteCommandHandler
  implements ICommandHandler<CloseVoteCommand>
{
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    @Inject(RESULT_CALCULATION_SERVICE)
    private readonly resultCalculationService: ResultCalculationService,
    @Inject(UNIT_OF_WORK)
    private readonly uow: UnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
  ) {}

  async execute(command: CloseVoteCommand): Promise<void> {
    const { tenantId, voteId, closedByMembershipId } = command;

    await this.uow.execute(async () => {
      const vote = await this.voteRepository.findById(tenantId, voteId);
      if (!vote) {
        throw new VoteNotFoundException();
      }

      vote.close(closedByMembershipId, this.clock.now());

      const snapshot = await this.resultCalculationService.calculate(
        tenantId,
        voteId,
        vote,
      );

      await this.voteRepository.save(vote);
      await this.voteRepository.saveResults(tenantId, voteId, snapshot);

      const actor = this.auditContext.requireActor();
      const closedByLabel = await this.labelResolver.resolveActorLabel(actor);

      const closedAt = this.clock.now();

      await this.auditService.append(
        VoteClosedAuditEvent.build({
          voteId: vote.id,
          tenantId: vote.tenantId,
          voteTitle: vote.title,
          actor,
          closedByLabel,
          closedAt,
        }),
      );

      const auditQuestions = snapshot.questionResults.map((q) => ({
        questionId: q.questionId,
        majorityMet: q.majorityMet,
        winningOptionId: q.winningOptionId,
      }));

      const labeledQuestions = snapshot.questionResults.map((q) => {
        const question = vote.questions.find((vq) => vq.id === q.questionId);
        if (!question) {
          throw new Error(
            `Invariant: result references question ${q.questionId} not in vote aggregate`,
          );
        }
        const winningOption =
          q.winningOptionId !== null
            ? question.options.find((o) => o.id === q.winningOptionId) ?? null
            : null;
        return {
          questionText: question.title,
          winningOptionText: winningOption?.label ?? null,
        };
      });

      await this.auditService.append(
        VoteResultsComputedAuditEvent.build({
          voteId: vote.id,
          tenantId: vote.tenantId,
          voteTitle: vote.title,
          actor,
          quorumReached: snapshot.quorumMet,
          questions: auditQuestions,
          labeledQuestions,
          occurredAt: closedAt,
        }),
      );
    });
  }
}
