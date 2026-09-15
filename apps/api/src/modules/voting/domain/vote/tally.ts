import { Rational } from '@/shared/domain/rational';

import {
  MajorityDenominatorBasis,
  QuorumMeasure,
  ThresholdComparator,
  VoteMode,
  VoteOptionSemantic,
  type FractionValue,
  type QuorumRule,
} from './vote.types';

export interface TallyElectorateRow {
  unitId: string;
  eligibilityStatus: string;
  ineligibleReason: string | null;
  weightNum: number;
  weightDen: number;
}
export interface TallyBallot {
  ballotId: string;
  unitId: string;
}
export interface TallyAnswer {
  ballotId: string;
  questionId: string;
  optionId: string;
}
export interface EffectiveMajorityRules {
  basis: MajorityDenominatorBasis;
  threshold: FractionValue;
  comparator: ThresholdComparator;
}
export interface TallyQuestionInput {
  id: string;
  options: { id: string; optionKey: VoteOptionSemantic }[];
  rules: EffectiveMajorityRules;
}
export interface TallyInput {
  mode: VoteMode;
  quorum: QuorumRule | null;
  questions: TallyQuestionInput[];
  electorate: TallyElectorateRow[];
  ballots: TallyBallot[];
  answers: TallyAnswer[];
}
export interface TallyOptionResult {
  optionId: string;
  voteWeight: Rational;
  voteUnitCount: number;
}
export interface TallyQuestionResult {
  questionId: string;
  majorityMet: boolean;
  winningOptionId: string | null;
  majorityThreshold: FractionValue;
  majorityComparator: ThresholdComparator;
  majorityDenominator: Rational;
  optionResults: TallyOptionResult[];
}
export interface TallyResult {
  quorumMet: boolean | null;
  participationWeight: Rational;
  participationUnitCount: number;
  eligibleWeight: Rational;
  eligibleUnitCount: number;
  totalVotesWeight: Rational;
  totalVotesUnitCount: number;
  questionResults: TallyQuestionResult[];
}

const meets = (
  value: Rational,
  threshold: FractionValue,
  comparator: ThresholdComparator,
  denominator: Rational,
): boolean => {
  const bar = Rational.from(threshold.num, threshold.den).mul(denominator);
  return comparator === ThresholdComparator.STRICT_GREATER
    ? value.gt(bar)
    : value.gte(bar);
};

export function computeVoteResults(input: TallyInput): TallyResult {
  const countable = input.electorate.filter(
    (row) => row.ineligibleReason !== 'ASSOCIATION_OWNED',
  );
  const weightByUnit = new Map(
    countable.map((row) => [
      row.unitId,
      Rational.from(row.weightNum, row.weightDen),
    ]),
  );

  const totalVotesWeight = Rational.sum([...weightByUnit.values()]);
  const totalVotesUnitCount = countable.length;

  // "Eligible" is narrower than "countable": an association-owned unit is
  // already out of `countable`, while a unit with no common representative
  // still counts toward the statutory total but cannot itself vote.
  const eligibleRows = countable.filter(
    (row) => row.eligibilityStatus === 'ELIGIBLE',
  );
  const eligibleUnitCount = eligibleRows.length;
  const eligibleWeight = Rational.sum(
    eligibleRows.map((row) => Rational.from(row.weightNum, row.weightDen)),
  );

  const participatingUnits = new Set(
    input.ballots
      .map((b) => b.unitId)
      .filter((unitId) => weightByUnit.has(unitId)),
  );
  const participationWeight = Rational.sum(
    [...participatingUnits].map(
      (unitId) => weightByUnit.get(unitId) as Rational,
    ),
  );
  const participationUnitCount = participatingUnits.size;

  let quorumMet: boolean | null = null;
  if (input.mode === VoteMode.ASSEMBLY_RECORD && input.quorum) {
    if (input.quorum.measure === QuorumMeasure.UNIT_SHARE) {
      quorumMet =
        !totalVotesWeight.isZero() &&
        meets(
          participationWeight,
          input.quorum.threshold,
          input.quorum.comparator,
          totalVotesWeight,
        );
    } else {
      quorumMet =
        totalVotesUnitCount > 0 &&
        meets(
          Rational.from(participationUnitCount, 1),
          input.quorum.threshold,
          input.quorum.comparator,
          Rational.from(totalVotesUnitCount, 1),
        );
    }
  }

  const unitByBallot = new Map(
    input.ballots.map((b) => [b.ballotId, b.unitId]),
  );

  const questionResults = input.questions.map((question) => {
    const weightByOption = new Map<string, Rational>(
      question.options.map((o) => [o.id, Rational.zero()]),
    );
    const countByOption = new Map<string, number>(
      question.options.map((o) => [o.id, 0]),
    );

    for (const answer of input.answers) {
      if (answer.questionId !== question.id) continue;
      const unitId = unitByBallot.get(answer.ballotId);
      const weight = unitId ? weightByUnit.get(unitId) : undefined;
      if (!weight) continue;
      weightByOption.set(
        answer.optionId,
        (weightByOption.get(answer.optionId) ?? Rational.zero()).add(weight),
      );
      countByOption.set(
        answer.optionId,
        (countByOption.get(answer.optionId) ?? 0) + 1,
      );
    }

    const optionResults: TallyOptionResult[] = question.options.map((o) => ({
      optionId: o.id,
      voteWeight: weightByOption.get(o.id) ?? Rational.zero(),
      voteUnitCount: countByOption.get(o.id) ?? 0,
    }));

    const majorityDenominator =
      question.rules.basis === MajorityDenominatorBasis.ALL_VOTES
        ? totalVotesWeight
        : Rational.sum(optionResults.map((o) => o.voteWeight));

    const nonAbstain = question.options.filter(
      (o) => o.optionKey !== VoteOptionSemantic.ABSTAIN,
    );
    let winningOptionId: string | null = null;
    let maxWeight = Rational.zero();
    let hasTie = false;
    for (const option of nonAbstain) {
      const weight = weightByOption.get(option.id) ?? Rational.zero();
      if (weight.gt(maxWeight)) {
        maxWeight = weight;
        winningOptionId = option.id;
        hasTie = false;
      } else if (!weight.isZero() && weight.eq(maxWeight)) {
        hasTie = true;
      }
    }
    if (hasTie) winningOptionId = null;

    let majorityMet = false;
    if (winningOptionId !== null && !majorityDenominator.isZero()) {
      majorityMet = meets(
        weightByOption.get(winningOptionId) ?? Rational.zero(),
        question.rules.threshold,
        question.rules.comparator,
        majorityDenominator,
      );
    }
    if (!majorityMet) winningOptionId = null;

    return {
      questionId: question.id,
      majorityMet,
      winningOptionId,
      majorityThreshold: question.rules.threshold,
      majorityComparator: question.rules.comparator,
      majorityDenominator,
      optionResults,
    };
  });

  return {
    quorumMet,
    participationWeight,
    participationUnitCount,
    eligibleWeight,
    eligibleUnitCount,
    totalVotesWeight,
    totalVotesUnitCount,
    questionResults,
  };
}
