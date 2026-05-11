import { Inject, Injectable } from '@nestjs/common';

import {
  VoteOptionResultSnapshot,
  VoteQuestionResultSnapshot,
  VoteResultSnapshot,
} from '@/modules/voting/domain/vote/vote-result.types';
import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import {
  ElectorateEligibilityStatus,
  MajorityRuleType,
  QuorumElectorateBasis,
  QuorumMeasure,
  VoteOptionSemantic,
  VoteQuestion,
  VoteRuleset,
} from '@/modules/voting/domain/vote/vote.types';

import {
  RESULT_CALCULATION_DATA_REPOSITORY,
  ResultCalculationAnswerData,
  type ResultCalculationDataRepository,
} from '../ports/result-calculation-data.repository.port';
import { ResultCalculationService } from '../ports/result-calculation.service.port';

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
    if (!vote.ruleset) {
      throw new Error(
        `Vote ${voteId} has no ruleset — cannot calculate results`,
      );
    }

    const electorateRows = await this.dataRepository.findElectorateSnapshot(
      tenantId,
      voteId,
    );
    const ballotRows = await this.dataRepository.findBallots(tenantId, voteId);

    const ballotIds = ballotRows.map((b) => b.ballotId);
    const answerRows = await this.dataRepository.findBallotAnswers(ballotIds);

    const weightByUnit = new Map<string, number>(
      electorateRows.map((e) => [e.unitId, Number(e.votingWeight)]),
    );

    const eligibilityByUnit = new Map<string, string>(
      electorateRows.map((e) => [e.unitId, e.eligibilityStatus]),
    );

    const unitByBallot = new Map<string, string>(
      ballotRows.map((b) => [b.ballotId, b.unitId]),
    );

    const participatingUnitIds = new Set(ballotRows.map((b) => b.unitId));

    const ruleset = vote.ruleset;

    const { denominatorWeight, denominatorUnitCount } = this.computeDenominator(
      electorateRows,
      ruleset,
    );

    let participationWeight = 0;
    for (const unitId of participatingUnitIds) {
      participationWeight += weightByUnit.get(unitId) ?? 0;
    }
    const participationUnitCount = participatingUnitIds.size;

    const quorumMet = this.checkQuorum(
      ruleset,
      participationWeight,
      participationUnitCount,
      denominatorWeight,
      denominatorUnitCount,
    );

    const questionResults: VoteQuestionResultSnapshot[] = [];

    for (const question of vote.questions) {
      const effectiveRuleset = question.rulesetOverride ?? ruleset;

      const answersForQuestion = answerRows.filter(
        (a) => a.questionId === question.id,
      );

      const questionResult = this.computeQuestionResult(
        question,
        effectiveRuleset,
        answersForQuestion,
        unitByBallot,
        weightByUnit,
        eligibilityByUnit,
      );

      questionResults.push(questionResult);
    }

    return {
      quorumMet,
      participationWeight,
      participationUnitCount,
      denominatorWeight,
      denominatorUnitCount,
      questionResults,
    };
  }

  private computeDenominator(
    electorateRows: {
      unitId: string;
      eligibilityStatus: string;
      votingWeight: string;
    }[],
    ruleset: VoteRuleset,
  ): { denominatorWeight: number; denominatorUnitCount: number } {
    const useEligibleOnly =
      ruleset.quorumElectorateBasis ===
      QuorumElectorateBasis.ELIGIBLE_UNITS_ONLY;

    const relevantRows = useEligibleOnly
      ? electorateRows.filter(
          (e) => e.eligibilityStatus === ElectorateEligibilityStatus.ELIGIBLE,
        )
      : electorateRows;

    const denominatorWeight = relevantRows.reduce(
      (sum, e) => sum + Number(e.votingWeight),
      0,
    );
    const denominatorUnitCount = relevantRows.length;

    return { denominatorWeight, denominatorUnitCount };
  }

  private checkQuorum(
    ruleset: VoteRuleset,
    participationWeight: number,
    participationUnitCount: number,
    denominatorWeight: number,
    denominatorUnitCount: number,
  ): boolean {
    const threshold = ruleset.quorumThreshold / 100;

    if (ruleset.quorumMeasure === QuorumMeasure.UNIT_SHARE) {
      if (denominatorWeight === 0) return false;
      return participationWeight / denominatorWeight >= threshold;
    } else {
      if (denominatorUnitCount === 0) return false;
      return participationUnitCount / denominatorUnitCount >= threshold;
    }
  }

  private computeQuestionResult(
    question: VoteQuestion,
    effectiveRuleset: VoteRuleset,
    answers: ResultCalculationAnswerData[],
    unitByBallot: Map<string, string>,
    weightByUnit: Map<string, number>,
    _eligibilityByUnit: Map<string, string>,
  ): VoteQuestionResultSnapshot {
    const weightByOption = new Map<string, number>();
    const countByOption = new Map<string, number>();

    for (const option of question.options) {
      weightByOption.set(option.id, 0);
      countByOption.set(option.id, 0);
    }

    for (const answer of answers) {
      const unitId = unitByBallot.get(answer.ballotId);
      if (!unitId) continue;

      const weight = weightByUnit.get(unitId) ?? 0;
      weightByOption.set(
        answer.optionId,
        (weightByOption.get(answer.optionId) ?? 0) + weight,
      );
      countByOption.set(
        answer.optionId,
        (countByOption.get(answer.optionId) ?? 0) + 1,
      );
    }

    const optionResults: VoteOptionResultSnapshot[] = question.options.map(
      (opt) => ({
        optionId: opt.id,
        voteWeight: weightByOption.get(opt.id) ?? 0,
        voteUnitCount: countByOption.get(opt.id) ?? 0,
      }),
    );

    const abstainOptionId = question.options.find(
      (o) => o.optionKey === VoteOptionSemantic.ABSTAIN,
    )?.id;

    let majorityDenominatorValue = 0;
    for (const opt of question.options) {
      const w = weightByOption.get(opt.id) ?? 0;
      if (
        effectiveRuleset.abstainExcludedFromMajorityDenominator &&
        opt.id === abstainOptionId
      ) {
        continue;
      }
      majorityDenominatorValue += w;
    }

    const nonAbstainOptions = question.options.filter(
      (o) => o.id !== abstainOptionId,
    );

    let winningOptionId: string | null = null;
    let maxWeight = -1;
    let hasTie = false;

    for (const opt of nonAbstainOptions) {
      const w = weightByOption.get(opt.id) ?? 0;
      if (w > maxWeight) {
        maxWeight = w;
        winningOptionId = opt.id;
        hasTie = false;
      } else if (w === maxWeight && maxWeight > 0) {
        hasTie = true;
      }
    }

    if (hasTie) {
      winningOptionId = null;
    }

    let majorityMet = false;
    let majorityThresholdValue: number | null = null;

    if (winningOptionId !== null && majorityDenominatorValue > 0) {
      const winningWeight = weightByOption.get(winningOptionId) ?? 0;

      if (
        effectiveRuleset.majorityRuleType === MajorityRuleType.SIMPLE_MAJORITY
      ) {
        majorityMet = winningWeight / majorityDenominatorValue > 0.5;
        majorityThresholdValue = null;
      } else {
        const threshold = (effectiveRuleset.majorityThreshold ?? 50) / 100;
        majorityThresholdValue = threshold;
        majorityMet = winningWeight / majorityDenominatorValue >= threshold;
      }
    }

    if (!majorityMet) {
      winningOptionId = null;
    }

    return {
      questionId: question.id,
      majorityMet,
      winningOptionId,
      majorityThresholdValue,
      majorityDenominatorValue,
      optionResults,
    };
  }
}
