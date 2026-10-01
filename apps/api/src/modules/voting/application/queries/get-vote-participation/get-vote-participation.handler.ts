import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import { TenantMembershipRole } from '@/shared/domain/membership';

import { GetVoteParticipationQuery } from './get-vote-participation.query';
import {
  type VoteParticipationResponseDto,
  type VoteParticipationUnitDto,
} from '../../../api/dto/vote.dto';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '../../ports/vote-read.repository.port';

const BOARD_VIEW_ROLES: readonly TenantMembershipRole[] = [
  TenantMembershipRole.ADMIN,
  TenantMembershipRole.BOARD_MEMBER,
  TenantMembershipRole.AUDITOR,
];

/**
 * What a unit owner may see: that a unit exists, its weight, and whether it
 * has voted. Built by construction rather than by deleting keys, so a field
 * added to the repository row is excluded by default instead of leaking
 * until someone remembers to redact it.
 *
 * `status` is narrowed too: a unit whose co-owners never settled on a
 * representative reads as simply "not voted" — to a neighbour the question is
 * whose ballot is missing, not why — while a unit with no owner on record
 * stays INELIGIBLE because it is genuinely outside the electorate.
 */
function toOwnerView(unit: VoteParticipationUnitDto): VoteParticipationUnitDto {
  return {
    unitId: unit.unitId,
    unitNo: unit.unitNo,
    share: unit.share,
    status:
      unit.status === 'INELIGIBLE' &&
      unit.ineligibleReason === 'NO_REPRESENTATIVE'
        ? 'NOT_VOTED'
        : unit.status,
    ownsUnit: unit.ownsUnit,
    isProxy: unit.isProxy,
  };
}

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

    const isBoardView = query.roles.some((role) =>
      BOARD_VIEW_ROLES.includes(role),
    );

    return { units: isBoardView ? units : units.map(toOwnerView) };
  }
}
