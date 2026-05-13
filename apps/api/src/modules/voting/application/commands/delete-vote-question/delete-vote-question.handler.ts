import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { VoteQuestionDeletedAuditEvent } from '@/modules/voting/audit/events/vote-question-deleted.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';

import { DeleteVoteQuestionCommand } from './delete-vote-question.command';
import { VOTE_WRITE_REPOSITORY } from '../../ports/vote-write.repository.port';
import type { VoteWriteRepository } from '../../ports/vote-write.repository.port';

@CommandHandler(DeleteVoteQuestionCommand)
export class DeleteVoteQuestionHandler
  implements ICommandHandler<DeleteVoteQuestionCommand>
{
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepository: VoteWriteRepository,
    private readonly unitOfWork: DrizzleUnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
  ) {}

  async execute(command: DeleteVoteQuestionCommand): Promise<void> {
    const { tenantId, voteId, questionId } = command;

    const aggregate = await this.voteWriteRepository.findById(tenantId, voteId);

    if (!aggregate) {
      throw new VoteNotFoundException();
    }

    const removedQuestion = aggregate.questions.find(
      (q) => q.id === questionId,
    );
    const removedQuestionTitle =
      removedQuestion?.title ?? `Question ${questionId.slice(0, 8)}`;

    aggregate.removeQuestion(questionId);

    await this.unitOfWork.execute(async () => {
      await this.voteWriteRepository.save(aggregate);

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        VoteQuestionDeletedAuditEvent.build({
          voteId: aggregate.id,
          tenantId: aggregate.tenantId,
          voteTitle: aggregate.title,
          questionId,
          questionTitle: removedQuestionTitle,
          actor,
          actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
