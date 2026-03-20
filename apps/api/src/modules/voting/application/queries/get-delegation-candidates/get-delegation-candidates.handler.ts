import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { DelegationCandidateDto } from '@/modules/voting/api/dto/vote.dto';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '@/modules/voting/application/ports/vote-read.repository.port';

import { GetDelegationCandidatesQuery } from './get-delegation-candidates.query';

@QueryHandler(GetDelegationCandidatesQuery)
export class GetDelegationCandidatesHandler
  implements IQueryHandler<GetDelegationCandidatesQuery>
{
  constructor(
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepo: VoteReadRepository,
  ) {}

  async execute(
    query: GetDelegationCandidatesQuery,
  ): Promise<DelegationCandidateDto[]> {
    return this.voteReadRepo.findDelegationCandidates(
      query.tenantId,
      query.voteId,
      query.unitId,
      query.forMembershipId,
      query.requesterMembershipId,
    );
  }
}
