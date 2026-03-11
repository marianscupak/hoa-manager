import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
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
    private readonly unitOfWork: DrizzleUnitOfWork,
  ) {}

  async execute(command: CreateVoteCommand): Promise<CreateVoteResult> {
    const vote = VoteAggregate.create(
      {
        title: command.data.title,
        description: command.data.description ?? null,
        scheduledFrom: command.data.scheduledFrom,
        scheduledTo: command.data.scheduledTo,
      },
      command.tenantId,
      command.createdByMembershipId,
      this.clock.now(),
    );

    await this.unitOfWork.execute(async () => {
      await this.voteRepository.save(vote);
    });

    return vote;
  }
}

