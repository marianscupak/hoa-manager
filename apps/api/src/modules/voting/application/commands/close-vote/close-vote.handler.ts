import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
import {
  type UnitOfWork,
  UNIT_OF_WORK,
} from '@/shared/application/ports/unit-of-work.port';

import { CloseVoteCommand } from './close-vote.command';
import {
  RESULT_CALCULATION_SERVICE,
  type ResultCalculationService,
} from '../../ports/result-calculation.service.port';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '../../ports/vote-write.repository.port';

@CommandHandler(CloseVoteCommand)
export class CloseVoteCommandHandler
  implements ICommandHandler<CloseVoteCommand>
{
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    @Inject(RESULT_CALCULATION_SERVICE)
    private readonly resultCalculationService: ResultCalculationService,
    @Inject(UNIT_OF_WORK)
    private readonly uow: UnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: CloseVoteCommand): Promise<void> {
    const { tenantId, voteId, closedByMembershipId } = command;

    await this.uow.execute(async () => {
      const vote = await this.voteRepository.findById(tenantId, voteId);
      if (!vote) {
        throw new VoteNotFoundException();
      }

      vote.close(closedByMembershipId, this.clock.now());

      const snapshot = await this.resultCalculationService.calculate(
        tenantId,
        voteId,
        vote,
      );

      await this.voteRepository.save(vote);
      await this.voteRepository.saveResults(tenantId, voteId, snapshot);
    });
  }
}
