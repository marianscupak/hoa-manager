import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { type VoteTurnoutResponseDto } from '@/modules/voting/api/dto/vote.dto';
import { ElectorateEligibilityStatus } from '@/modules/voting/domain/vote/vote.types';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

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

    const weightByUnit = new Map(
      electorate.map((e) => [e.unitId, Number(e.votingWeight)]),
    );
    const participatingUnitIds = new Set(ballots.map((b) => b.unitId));

    let participationWeight = 0;
    for (const unitId of participatingUnitIds) {
      participationWeight += weightByUnit.get(unitId) ?? 0;
    }

    const eligible = electorate.filter(
      (e) => e.eligibilityStatus === ElectorateEligibilityStatus.ELIGIBLE,
    );

    return {
      participationUnitCount: participatingUnitIds.size,
      eligibleUnitCount: eligible.length,
      participationWeight,
      eligibleWeight: eligible.reduce(
        (sum, e) => sum + Number(e.votingWeight),
        0,
      ),
    };
  }
}
