import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { VoteConsentResponseDto } from '@/modules/voting/api/dto/vote.dto';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '@/modules/voting/application/ports/vote-read.repository.port';

import { GetConsentsQuery } from './get-consents.query';

@QueryHandler(GetConsentsQuery)
export class GetConsentsHandler implements IQueryHandler<GetConsentsQuery> {
  constructor(
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepo: VoteReadRepository,
  ) {}

  async execute(query: GetConsentsQuery): Promise<VoteConsentResponseDto[]> {
    const isAdmin =
      query.roles.includes('ADMIN') || query.roles.includes('BOARD_MEMBER');

    return this.voteReadRepo.findConsents(
      query.tenantId,
      query.membershipId,
      isAdmin,
    );
  }
}
