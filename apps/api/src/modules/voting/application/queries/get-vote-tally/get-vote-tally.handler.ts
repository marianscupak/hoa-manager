import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  toFractionDto,
  type VoteTallyResponseDto,
} from '@/modules/voting/api/dto/vote.dto';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { GetVoteTallyQuery } from './get-vote-tally.query';
import {
  RESULT_CALCULATION_SERVICE,
  type ResultCalculationService,
} from '../../ports/result-calculation.service.port';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '../../ports/vote-write.repository.port';

/**
 * The running tally is the board-only counterpart of turnout: the same
 * `computeVoteResults` run, but surfacing per-question, per-option shares
 * rather than aggregate participation. That per-option detail is what makes
 * it sensitive enough to gate to ADMIN, BOARD_MEMBER and AUDITOR — unlike
 * turnout, it discloses which way the vote is currently leaning.
 */
@QueryHandler(GetVoteTallyQuery)
export class GetVoteTallyHandler
  implements IQueryHandler<GetVoteTallyQuery, VoteTallyResponseDto>
{
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    @Inject(RESULT_CALCULATION_SERVICE)
    private readonly resultCalculation: ResultCalculationService,
  ) {}

  async execute(query: GetVoteTallyQuery): Promise<VoteTallyResponseDto> {
    const vote = await this.voteRepository.findById(
      query.tenantId,
      query.voteId,
    );

    // The electorate snapshot is written when a vote opens, so the tally
    // does not exist as a resource before that. `calculate` additionally
    // requires a ruleset — guaranteed here, because `VoteAggregate.open`
    // only accepts a SCHEDULED vote and `schedule` rejects a vote without
    // one.
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
      questions: result.questionResults.map((question) => ({
        questionId: question.questionId,
        majorityDenominator: toFractionDto(question.majorityDenominator),
        options: question.optionResults.map((option) => ({
          optionId: option.optionId,
          voteUnitCount: option.voteUnitCount,
          voteWeight: toFractionDto(option.voteWeight),
        })),
      })),
    };
  }
}
