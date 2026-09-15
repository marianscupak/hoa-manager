import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '@/modules/voting/application/ports/vote-read.repository.port';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

import { GetVoteParticipationQuery } from './get-vote-participation.query';
import { VoteParticipationResponseDto } from '../../../api/dto/vote.dto';

@QueryHandler(GetVoteParticipationQuery)
export class GetVoteParticipationHandler
  implements
    IQueryHandler<GetVoteParticipationQuery, VoteParticipationResponseDto>
{
  constructor(
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepository: VoteReadRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(
    query: GetVoteParticipationQuery,
  ): Promise<VoteParticipationResponseDto> {
    const units = await this.voteReadRepository.findParticipation(
      query.tenantId,
      query.voteId,
      query.requesterMembershipId,
      this.clock.now(),
    );

    // An empty snapshot means the vote never opened or is not this
    // tenant's — same reasoning `GetVoteTurnoutHandler` already uses.
    if (units.length === 0) {
      throw new VoteNotFoundException();
    }

    return { units };
  }
}
