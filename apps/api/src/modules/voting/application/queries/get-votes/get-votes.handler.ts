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
    const { tenantId, roles, membershipId } = query;

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

    const votes = await this.voteReadRepository.findVotes(tenantId, statuses);

    // Compute voter summaries for scheduled and open votes
    const voteIdsForSummary = votes
      .filter(
        (v) =>
          v.status === VoteStatus.SCHEDULED || v.status === VoteStatus.OPEN,
      )
      .map((v) => v.id);

    if (voteIdsForSummary.length > 0) {
      const summaries =
        await this.voteReadRepository.findVoterSummariesForVotes(
          tenantId,
          voteIdsForSummary,
          membershipId,
        );

      for (const vote of votes) {
        if (
          vote.status === VoteStatus.SCHEDULED ||
          vote.status === VoteStatus.OPEN
        ) {
          vote.voterSummary = summaries.get(vote.id) ?? null;
        }
      }
    }

    return votes;
  }
}
