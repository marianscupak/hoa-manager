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

const MEMBER_VISIBLE_STATUSES: readonly VoteStatus[] = [
  VoteStatus.SCHEDULED,
  VoteStatus.OPEN,
  VoteStatus.CLOSED,
  VoteStatus.CANCELLED,
];

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

    // A member without the board role never sees a DRAFT, the same rule as
    // GetVoteDetailHandler. A requested status filter narrows the visible
    // set, it cannot widen it: `?status=DRAFT` used to return the drafts.
    const requested = query.statuses as VoteStatus[] | undefined;
    const statuses = isAdminOrBoard
      ? requested
      : (requested ?? MEMBER_VISIBLE_STATUSES).filter((s) =>
          MEMBER_VISIBLE_STATUSES.includes(s),
        );

    // An empty filter means "no filter" to the repository, so a request for
    // nothing but hidden statuses must stop here.
    if (statuses?.length === 0) {
      return [];
    }

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
