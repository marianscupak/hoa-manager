import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { UpdateVoteQuestionCommand } from './update-vote-question.command';
import { VOTE_WRITE_REPOSITORY } from '../../ports/vote-write.repository.port';
import type { VoteWriteRepository } from '../../ports/vote-write.repository.port';

@CommandHandler(UpdateVoteQuestionCommand)
export class UpdateVoteQuestionHandler implements ICommandHandler<UpdateVoteQuestionCommand> {
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepository: VoteWriteRepository,
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
    });

    await this.voteWriteRepository.save(aggregate);
  }
}
