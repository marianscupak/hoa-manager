import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '@/modules/voting/application/ports/vote-write.repository.port';
import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';

import {
  CreateVoteCommand,
  type CreateVoteResult,
} from './create-vote.command';

@CommandHandler(CreateVoteCommand)
export class CreateVoteHandler implements ICommandHandler<CreateVoteCommand> {
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: CreateVoteCommand): Promise<CreateVoteResult> {
    const vote = VoteAggregate.create(
      command.data,
      command.tenantId,
      command.createdByMembershipId,
      this.clock.now(),
    );

    await this.voteRepository.save(vote);

    return vote;
  }
}
