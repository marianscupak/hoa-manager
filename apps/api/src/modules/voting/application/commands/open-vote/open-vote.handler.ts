import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
import {
  type UnitOfWork,
  UNIT_OF_WORK,
} from '@/shared/application/ports/unit-of-work.port';

import { OpenVoteCommand } from './open-vote.command';
import {
  ELECTORATE_SERVICE,
  type ElectorateService,
} from '../../ports/electorate-service.port';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '../../ports/vote-write.repository.port';

@CommandHandler(OpenVoteCommand)
export class OpenVoteCommandHandler
  implements ICommandHandler<OpenVoteCommand>
{
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    @Inject(ELECTORATE_SERVICE)
    private readonly electorateService: ElectorateService,
    @Inject(UNIT_OF_WORK)
    private readonly uow: UnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: OpenVoteCommand): Promise<void> {
    const { tenantId, voteId, openedByMembershipId } = command;

    await this.uow.execute(async () => {
      const vote = await this.voteRepository.findById(tenantId, voteId);
      if (!vote) {
        throw new VoteNotFoundException();
      }

      vote.open(openedByMembershipId, this.clock.now());

      const electorate = await this.electorateService.resolveElectorate(vote);

      await this.voteRepository.save(vote);
      await this.voteRepository.saveElectorateUnits(
        tenantId,
        voteId,
        electorate,
      );
    });
  }
}
