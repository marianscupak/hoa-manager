import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { type VoteListItemResponseDto } from '@/modules/voting/api/dto/vote.dto';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '@/modules/voting/application/ports/vote-read.repository.port';
import { GetVotesQuery } from '@/modules/voting/application/queries/get-votes/get-votes.query';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';

@QueryHandler(GetVotesQuery)
export class GetVotesHandler
  implements IQueryHandler<GetVotesQuery, VoteListItemResponseDto[]>
{
  constructor(
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepository: VoteReadRepository,
  ) {}

  async execute(query: GetVotesQuery): Promise<VoteListItemResponseDto[]> {
    const { tenantId, roles } = query;

    const isAdminOrBoard =
      roles.includes(TenantMembershipRole.ADMIN) ||
      roles.includes(TenantMembershipRole.BOARD_MEMBER);

    // If admin or board member, fetch all votes (statuses = undefined)
    // Otherwise, exclude DRAFT votes
    const statuses = isAdminOrBoard
      ? undefined
      : [
          VoteStatus.SCHEDULED,
          VoteStatus.OPEN,
          VoteStatus.CLOSED,
          VoteStatus.CANCELLED,
        ];

    return this.voteReadRepository.findVotes(tenantId, statuses);
  }
}
