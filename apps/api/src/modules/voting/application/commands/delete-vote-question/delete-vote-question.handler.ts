import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

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
  ) {}

  async execute(command: DeleteVoteQuestionCommand): Promise<void> {
    const { tenantId, voteId, questionId } = command;

    const aggregate = await this.voteWriteRepository.findById(tenantId, voteId);

    if (!aggregate) {
      throw new VoteNotFoundException();
    }

    aggregate.removeQuestion(questionId);

    await this.voteWriteRepository.save(aggregate);
  }
}
