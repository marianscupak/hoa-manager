import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { VoteQuestionCreatedAuditEvent } from '@/modules/voting/audit/events/vote-question-created.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { materializeRuleset } from '@/modules/voting/domain/vote/ruleset-validation';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

import { CreateVoteQuestionCommand } from './create-vote-question.command';
import { VOTE_WRITE_REPOSITORY } from '../../ports/vote-write.repository.port';
import type { VoteWriteRepository } from '../../ports/vote-write.repository.port';

@CommandHandler(CreateVoteQuestionCommand)
export class CreateVoteQuestionHandler
  implements ICommandHandler<CreateVoteQuestionCommand>
{
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepository: VoteWriteRepository,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
  ) {}

  async execute(command: CreateVoteQuestionCommand): Promise<void> {
    const { tenantId, voteId, data } = command;

    const aggregate = await this.voteWriteRepository.findById(tenantId, voteId);

    if (!aggregate) {
      throw new VoteNotFoundException();
    }

    const idsBefore = new Set(aggregate.questions.map((q) => q.id));

    aggregate.addQuestion({
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      sortOrder: data.sortOrder,
      options: data.options,
      rulesetOverride: data.rulesetOverride
        ? materializeRuleset(data.rulesetOverride)
        : undefined,
    });

    const addedQuestion = aggregate.questions.find((q) => !idsBefore.has(q.id));

    if (!addedQuestion) {
      throw new Error('Internal: addQuestion did not produce a new question');
    }

    await this.unitOfWork.execute(async () => {
      await this.voteWriteRepository.save(aggregate);

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        VoteQuestionCreatedAuditEvent.build({
          voteId: aggregate.id,
          tenantId: aggregate.tenantId,
          voteTitle: aggregate.title,
          questionId: addedQuestion.id,
          questionTitle: addedQuestion.title,
          actor,
          actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
