import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '@/modules/voting/application/ports/vote-write.repository.port';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';

import {
  UpdateVoteCommand,
  type UpdateVoteResult,
} from './update-vote.command';

@CommandHandler(UpdateVoteCommand)
export class UpdateVoteHandler implements ICommandHandler<UpdateVoteCommand> {
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly unitOfWork: DrizzleUnitOfWork,
  ) {}

  async execute(command: UpdateVoteCommand): Promise<UpdateVoteResult> {
    const vote = await this.voteRepository.findById(
      command.tenantId,
      command.id,
    );

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    vote.update(command.data, this.clock.now());

    await this.unitOfWork.execute(async () => {
      await this.voteRepository.save(vote);
    });

    return vote;
  }
}
