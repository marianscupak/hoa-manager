import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

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
    private readonly unitOfWork: DrizzleUnitOfWork,
  ) {}

  async execute(command: CreateVoteQuestionCommand): Promise<void> {
    const { tenantId, voteId, data } = command;

    const aggregate = await this.voteWriteRepository.findById(tenantId, voteId);

    if (!aggregate) {
      throw new VoteNotFoundException();
    }

    aggregate.addQuestion({
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      sortOrder: data.sortOrder,
      options: data.options,
      rulesetOverride: data.rulesetOverride,
    });

    await this.unitOfWork.execute(async () => {
      await this.voteWriteRepository.save(aggregate);
    });
  }
}
