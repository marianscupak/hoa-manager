import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { type VoteTurnoutResponseDto } from '@/modules/voting/api/dto/vote.dto';
import {
  ElectorateEligibilityStatus,
  QuorumElectorateBasis,
} from '@/modules/voting/domain/vote/vote.types';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { GetVoteTurnoutQuery } from './get-vote-turnout.query';
import {
  RESULT_CALCULATION_DATA_REPOSITORY,
  type ResultCalculationDataRepository,
} from '../../ports/result-calculation-data.repository.port';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '../../ports/vote-read.repository.port';

@QueryHandler(GetVoteTurnoutQuery)
export class GetVoteTurnoutHandler
  implements IQueryHandler<GetVoteTurnoutQuery, VoteTurnoutResponseDto>
{
  constructor(
    @Inject(RESULT_CALCULATION_DATA_REPOSITORY)
    private readonly dataRepository: ResultCalculationDataRepository,
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepository: VoteReadRepository,
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

    // Mirrors ResultCalculationService.computeDenominator so the mid-vote
    // turnout line and the computed results quote the same total. A missing
    // vote/ruleset is defensive only (a vote without a ruleset can never
    // open, so it can never have an electorate snapshot) and falls back to
    // the ALL_UNITS default.
    const vote = await this.voteReadRepository.findDetailById(
      query.tenantId,
      query.voteId,
    );
    const useEligibleOnly =
      vote?.ruleset?.quorumElectorateBasis ===
      QuorumElectorateBasis.ELIGIBLE_UNITS_ONLY;
    const denominatorRows = useEligibleOnly ? eligible : electorate;

    return {
      participationUnitCount: participatingUnitIds.size,
      eligibleUnitCount: eligible.length,
      participationWeight,
      eligibleWeight: eligible.reduce(
        (sum, e) => sum + Number(e.votingWeight),
        0,
      ),
      denominatorUnitCount: denominatorRows.length,
      denominatorWeight: denominatorRows.reduce(
        (sum, e) => sum + Number(e.votingWeight),
        0,
      ),
    };
  }
}
