import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '@/modules/voting/application/ports/vote-write.repository.port';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

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
      throw new DomainException(ErrorCode.VOTE_NOT_FOUND);
    }

    vote.update(command.data, this.clock.now());

    await this.unitOfWork.execute(async () => {
      await this.voteRepository.save(vote);
    });

    return vote;
  }
}
