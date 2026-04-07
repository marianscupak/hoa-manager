import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { type VoteResultsResponseDto } from '@/modules/voting/api/dto/vote.dto';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { GetVoteResultsQuery } from './get-vote-results.query';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '../../ports/vote-read.repository.port';

@QueryHandler(GetVoteResultsQuery)
export class GetVoteResultsHandler
  implements IQueryHandler<GetVoteResultsQuery, VoteResultsResponseDto>
{
  constructor(
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepository: VoteReadRepository,
  ) {}

  async execute(query: GetVoteResultsQuery): Promise<VoteResultsResponseDto> {
    const { tenantId, voteId } = query;

    const result = await this.voteReadRepository.findResultsByVoteId(
      tenantId,
      voteId,
    );

    if (!result) {
      throw new VoteNotFoundException();
    }

    return result;
  }
}
