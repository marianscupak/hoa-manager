import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '@/modules/voting/application/ports/vote-read.repository.port';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

import { GetVoterStatusQuery } from './get-voter-status.query';
import { VoterStatusResponseDto } from '../../../api/dto/vote.dto';

@QueryHandler(GetVoterStatusQuery)
export class GetVoterStatusHandler
  implements IQueryHandler<GetVoterStatusQuery, VoterStatusResponseDto>
{
  constructor(
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepository: VoteReadRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(query: GetVoterStatusQuery): Promise<VoterStatusResponseDto> {
    return this.voteReadRepository.findVoterStatus(
      query.tenantId,
      query.voteId,
      query.membershipId,
      this.clock.now(),
    );
  }
}
