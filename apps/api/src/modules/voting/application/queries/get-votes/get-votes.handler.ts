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
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

@QueryHandler(GetVotesQuery)
export class GetVotesHandler
  implements IQueryHandler<GetVotesQuery, VoteListItemResponseDto[]>
{
  constructor(
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepository: VoteReadRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(query: GetVotesQuery): Promise<VoteListItemResponseDto[]> {
    const { tenantId, roles, membershipId } = query;

    const isAdminOrBoard =
      roles.includes(TenantMembershipRole.ADMIN) ||
      roles.includes(TenantMembershipRole.BOARD_MEMBER);

    const statuses =
      (query.statuses as VoteStatus[]) ??
      (isAdminOrBoard
        ? undefined
        : [
            VoteStatus.SCHEDULED,
            VoteStatus.OPEN,
            VoteStatus.CLOSED,
            VoteStatus.CANCELLED,
          ]);

    const votes = await this.voteReadRepository.findVotes(tenantId, statuses);

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
          this.clock.now(),
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

    const closedVoteIds = votes
      .filter((v) => v.status === VoteStatus.CLOSED)
      .map((v) => v.id);
    if (closedVoteIds.length > 0) {
      const outcomes =
        await this.voteReadRepository.findQuestionOutcomesForVotes(
          tenantId,
          closedVoteIds,
        );

      for (const vote of votes) {
        if (vote.status === VoteStatus.CLOSED) {
          vote.questionOutcomes = outcomes.get(vote.id);
        }
      }
    }

    return votes;
  }
}
