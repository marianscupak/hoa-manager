import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { VoteQuestionUpdatedAuditEvent } from '@/modules/voting/audit/events/vote-question-updated.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';

import { UpdateVoteQuestionCommand } from './update-vote-question.command';
import { VOTE_WRITE_REPOSITORY } from '../../ports/vote-write.repository.port';
import type { VoteWriteRepository } from '../../ports/vote-write.repository.port';

@CommandHandler(UpdateVoteQuestionCommand)
export class UpdateVoteQuestionHandler
  implements ICommandHandler<UpdateVoteQuestionCommand>
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

  async execute(command: UpdateVoteQuestionCommand): Promise<void> {
    const { tenantId, voteId, questionId, data } = command;

    const aggregate = await this.voteWriteRepository.findById(tenantId, voteId);

    if (!aggregate) {
      throw new VoteNotFoundException();
    }

    aggregate.updateQuestion(questionId, {
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      sortOrder: data.sortOrder,
      options: data.options,
      rulesetOverride: data.rulesetOverride,
    });

    const updatedQuestion = aggregate.questions.find(
      (q) => q.id === questionId,
    );

    await this.unitOfWork.execute(async () => {
      await this.voteWriteRepository.save(aggregate);

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        VoteQuestionUpdatedAuditEvent.build({
          voteId: aggregate.id,
          tenantId: aggregate.tenantId,
          voteTitle: aggregate.title,
          questionId,
          questionTitle: updatedQuestion?.title ?? data.title,
          actor,
          actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
