import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '@/modules/voting/application/ports/vote-write.repository.port';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';

import {
  ScheduleVoteCommand,
  type ScheduleVoteResult,
} from './schedule-vote.command';

@CommandHandler(ScheduleVoteCommand)
export class ScheduleVoteHandler
  implements ICommandHandler<ScheduleVoteCommand>
{
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    private readonly unitOfWork: DrizzleUnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: ScheduleVoteCommand): Promise<ScheduleVoteResult> {
    const vote = await this.voteRepository.findById(
      command.tenantId,
      command.id,
    );

    if (!vote) {
      throw new VoteNotFoundException();
    }

    vote.schedule(this.clock.now());

    await this.unitOfWork.execute(async () => {
      await this.voteRepository.save(vote);
    });

    return vote;
  }
}
