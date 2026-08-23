import { Inject, Injectable } from '@nestjs/common';

import { computeVoteResults } from '@/modules/voting/domain/vote/tally';
import { VoteResultSnapshot } from '@/modules/voting/domain/vote/vote-result.types';
import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';

import {
  RESULT_CALCULATION_DATA_REPOSITORY,
  type ResultCalculationDataRepository,
} from '../ports/result-calculation-data.repository.port';
import { ResultCalculationService } from '../ports/result-calculation.service.port';

/**
 * Thin adapter: loads the snapshotted electorate plus the cast ballots and
 * hands them to the pure `computeVoteResults` tally function.
 */
@Injectable()
export class ResultCalculationDomainService
  implements ResultCalculationService
{
  constructor(
    @Inject(RESULT_CALCULATION_DATA_REPOSITORY)
    private readonly dataRepository: ResultCalculationDataRepository,
  ) {}

  async calculate(
    tenantId: string,
    voteId: string,
    vote: VoteAggregate,
  ): Promise<VoteResultSnapshot> {
    const ruleset = vote.ruleset;
    if (!ruleset) {
      throw new Error(
        `Vote ${voteId} has no ruleset — cannot calculate results`,
      );
    }

    const electorateRows = await this.dataRepository.findElectorateSnapshot(
      tenantId,
      voteId,
    );
    const ballotRows = await this.dataRepository.findBallots(tenantId, voteId);
    const answerRows = await this.dataRepository.findBallotAnswers(
      ballotRows.map((b) => b.ballotId),
    );

    return computeVoteResults({
      mode: vote.mode,
      quorum: ruleset.quorum,
      questions: vote.questions.map((q) => {
        const eff = q.rulesetOverride ?? ruleset;
        return {
          id: q.id,
          options: q.options.map((o) => ({
            id: o.id,
            optionKey: o.optionKey,
          })),
          rules: {
            basis: eff.majorityDenominatorBasis,
            threshold: eff.majorityThreshold,
            comparator: eff.majorityComparator,
          },
        };
      }),
      electorate: electorateRows.map((e) => ({
        unitId: e.unitId,
        ineligibleReason: e.ineligibleReason,
        weightNum: e.weightNum,
        weightDen: e.weightDen,
      })),
      ballots: ballotRows,
      answers: answerRows,
    });
  }
}
