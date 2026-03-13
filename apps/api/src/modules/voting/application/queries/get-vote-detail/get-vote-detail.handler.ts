import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { GetVoteDetailQuery } from './get-vote-detail.query';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '../../ports/vote-read.repository.port';

@QueryHandler(GetVoteDetailQuery)
export class GetVoteDetailHandler implements IQueryHandler<GetVoteDetailQuery> {
  constructor(
    @Inject(VOTE_READ_REPOSITORY)
    private readonly repository: VoteReadRepository,
  ) {}

  async execute(query: GetVoteDetailQuery) {
    const vote = await this.repository.findDetailById(query.tenantId, query.id);

    if (!vote) {
      throw new VoteNotFoundException();
    }

    const isPrivileged =
      query.roles.includes('ADMIN') || query.roles.includes('BOARD_MEMBER');

    if (vote.status === 'DRAFT' && !isPrivileged) {
      throw new VoteNotFoundException();
    }

    return vote;
  }
}
