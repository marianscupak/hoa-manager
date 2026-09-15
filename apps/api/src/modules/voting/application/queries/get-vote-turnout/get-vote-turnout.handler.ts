import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  toFractionDto,
  toPercentString,
  type VoteTurnoutResponseDto,
} from '@/modules/voting/api/dto/vote.dto';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { GetVoteTurnoutQuery } from './get-vote-turnout.query';
import {
  RESULT_CALCULATION_SERVICE,
  type ResultCalculationService,
} from '../../ports/result-calculation.service.port';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '../../ports/vote-write.repository.port';

/**
 * Turnout is the live counterpart of the closed-vote result: the same
 * `computeVoteResults` run against the ballots cast so far, minus the
 * per-question detail. Reusing the calculation service rather than
 * re-deriving participation here is what keeps mid-vote turnout and the
 * final results page quoting the same denominators.
 *
 * Readable by every tenant member — unlike the running tally, turnout
 * discloses no individual ballot.
 */
@QueryHandler(GetVoteTurnoutQuery)
export class GetVoteTurnoutHandler
  implements IQueryHandler<GetVoteTurnoutQuery, VoteTurnoutResponseDto>
{
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    @Inject(RESULT_CALCULATION_SERVICE)
    private readonly resultCalculation: ResultCalculationService,
  ) {}

  async execute(query: GetVoteTurnoutQuery): Promise<VoteTurnoutResponseDto> {
    const vote = await this.voteRepository.findById(
      query.tenantId,
      query.voteId,
    );

    // The electorate snapshot is written when a vote opens, so turnout does
    // not exist as a resource before that. `calculate` additionally requires
    // a ruleset — guaranteed here, because `VoteAggregate.open` only accepts
    // a SCHEDULED vote and `schedule` rejects a vote without one.
    if (
      !vote ||
      vote.status === VoteStatus.DRAFT ||
      vote.status === VoteStatus.SCHEDULED
    ) {
      throw new VoteNotFoundException();
    }

    const result = await this.resultCalculation.calculate(
      query.tenantId,
      query.voteId,
      vote,
    );

    return {
      participationUnitCount: result.participationUnitCount,
      eligibleUnitCount: result.eligibleUnitCount,
      participationWeight: toFractionDto(result.participationWeight),
      eligibleWeight: toFractionDto(result.eligibleWeight),
      totalVotesUnitCount: result.totalVotesUnitCount,
      totalVotesWeight: toFractionDto(result.totalVotesWeight),
      participationPercent: toPercentString(
        result.participationWeight,
        result.totalVotesWeight,
      ),
      quorumMet: result.quorumMet,
    };
  }
}
