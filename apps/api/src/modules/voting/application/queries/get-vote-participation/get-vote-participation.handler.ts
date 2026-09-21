import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { isRecordableOnPaper } from '@/modules/voting/domain/vote/paper-ballot-eligibility';
import { type ElectorateIneligibleReason } from '@/modules/voting/domain/vote/vote.types';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

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
 * The snapshot says who may cast in the app; this screen is where the board
 * records paper ballots, which only need a signing owner. A unit the snapshot
 * marked ineligible for want of a common representative therefore reads as
 * simply "not voted" — still awaiting its paper ballot — while the reason is
 * kept so the board view can say the unit cannot vote in the app.
 */
function withPaperRecordability(
  unit: VoteParticipationUnitDto,
): VoteParticipationUnitDto {
  if (
    unit.status === 'INELIGIBLE' &&
    isRecordableOnPaper(
      (unit.ineligibleReason as ElectorateIneligibleReason | undefined) ?? null,
    )
  ) {
    return { ...unit, status: 'NOT_VOTED' };
  }
  return unit;
}

/**
 * What a unit owner may see: that a unit exists, its weight, and whether it
 * has voted. Built by construction rather than by deleting keys, so a field
 * added to the repository row is excluded by default instead of leaking
 * until someone remembers to redact it. `ineligibleReason` stays out: the
 * remaining INELIGIBLE units are genuinely outside the electorate, and an
 * owner does not need to know why.
 */
function toOwnerView(unit: VoteParticipationUnitDto): VoteParticipationUnitDto {
  return {
    unitId: unit.unitId,
    unitNo: unit.unitNo,
    share: unit.share,
    status: unit.status,
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

    const recordable = units.map(withPaperRecordability);
    return { units: isBoardView ? recordable : recordable.map(toOwnerView) };
  }
}
