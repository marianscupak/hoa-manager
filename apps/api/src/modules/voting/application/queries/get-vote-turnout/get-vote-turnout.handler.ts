import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  toFractionDto,
  toPercentString,
  type VoteTurnoutResponseDto,
} from '@/modules/voting/api/dto/vote.dto';
import {
  ElectorateEligibilityStatus,
  ElectorateIneligibleReason,
} from '@/modules/voting/domain/vote/vote.types';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { Rational } from '@/shared/domain/rational';

import { GetVoteTurnoutQuery } from './get-vote-turnout.query';
import {
  RESULT_CALCULATION_DATA_REPOSITORY,
  type ResultCalculationDataRepository,
} from '../../ports/result-calculation-data.repository.port';

@QueryHandler(GetVoteTurnoutQuery)
export class GetVoteTurnoutHandler
  implements IQueryHandler<GetVoteTurnoutQuery, VoteTurnoutResponseDto>
{
  constructor(
    @Inject(RESULT_CALCULATION_DATA_REPOSITORY)
    private readonly dataRepository: ResultCalculationDataRepository,
  ) {}

  async execute(query: GetVoteTurnoutQuery): Promise<VoteTurnoutResponseDto> {
    const electorate = await this.dataRepository.findElectorateSnapshot(
      query.tenantId,
      query.voteId,
    );

    // The snapshot is created when a vote opens — no snapshot means the
    // turnout resource does not exist yet (DRAFT/SCHEDULED) or the vote
    // is not visible to this tenant.
    if (electorate.length === 0) {
      throw new VoteNotFoundException();
    }

    const ballots = await this.dataRepository.findBallots(
      query.tenantId,
      query.voteId,
    );

    // Mirrors `computeVoteResults`: every unit counts toward the statutory
    // "all votes" total except association-owned ones, so mid-vote turnout
    // and the computed results quote the same denominator.
    const countable = electorate.filter(
      (e) => e.ineligibleReason !== ElectorateIneligibleReason.ASSOCIATION_OWNED,
    );
    const weightByUnit = new Map(
      countable.map((e) => [e.unitId, Rational.from(e.weightNum, e.weightDen)]),
    );

    const participatingUnitIds = new Set(
      ballots.map((b) => b.unitId).filter((unitId) => weightByUnit.has(unitId)),
    );
    const participationWeight = Rational.sum(
      [...participatingUnitIds].map(
        (unitId) => weightByUnit.get(unitId) as Rational,
      ),
    );

    const eligible = countable.filter(
      (e) => e.eligibilityStatus === ElectorateEligibilityStatus.ELIGIBLE,
    );
    const eligibleWeight = Rational.sum(
      eligible.map((e) => Rational.from(e.weightNum, e.weightDen)),
    );
    const totalVotesWeight = Rational.sum([...weightByUnit.values()]);

    return {
      participationUnitCount: participatingUnitIds.size,
      eligibleUnitCount: eligible.length,
      participationWeight: toFractionDto(participationWeight),
      eligibleWeight: toFractionDto(eligibleWeight),
      totalVotesUnitCount: countable.length,
      totalVotesWeight: toFractionDto(totalVotesWeight),
      participationPercent: toPercentString(
        participationWeight,
        totalVotesWeight,
      ),
    };
  }
}
