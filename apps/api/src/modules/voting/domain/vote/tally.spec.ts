import { Rational } from '@/shared/domain/rational';

import { computeVoteResults, type TallyElectorateRow, type TallyInput } from './tally';
import {
  MajorityDenominatorBasis, QuorumMeasure, ThresholdComparator,
  VoteMode, VoteOptionSemantic,
} from './vote.types';

const STRICT = ThresholdComparator.STRICT_GREATER;
const AT_LEAST = ThresholdComparator.AT_LEAST;
const HALF = { num: 1, den: 2 };

const QUESTION = (rules: Partial<TallyInput['questions'][0]['rules']> = {}) => ({
  id: 'q1',
  options: [
    { id: 'yes', optionKey: VoteOptionSemantic.YES },
    { id: 'no', optionKey: VoteOptionSemantic.NO },
    { id: 'abstain', optionKey: VoteOptionSemantic.ABSTAIN },
  ],
  rules: {
    basis: MajorityDenominatorBasis.VOTES_CAST,
    threshold: HALF,
    comparator: STRICT,
    ...rules,
  },
});

/** n equal units 1/total each; the first `yes` vote YES, next `no` vote NO, next `abstain` abstain, rest silent. */
function building(total: number, yes: number, no: number, abstain = 0) {
  const electorate: TallyElectorateRow[] = Array.from({ length: total }, (_, i) => ({
    unitId: `u${i}`, ineligibleReason: null, weightNum: 1, weightDen: total,
  }));
  const ballots: { ballotId: string; unitId: string }[] = [];
  const answers: { ballotId: string; questionId: string; optionId: string }[] = [];
  for (let i = 0; i < yes + no + abstain; i++) {
    const optionId = i < yes ? 'yes' : i < yes + no ? 'no' : 'abstain';
    ballots.push({ ballotId: `b${i}`, unitId: `u${i}` });
    answers.push({ ballotId: `b${i}`, questionId: 'q1', optionId });
  }
  return { electorate, ballots, answers };
}

describe('computeVoteResults', () => {
  it('golden: 100 units, 35 yes / 25 no / 40 silent — passes as assembly, fails as per rollam', () => {
    const data = building(100, 35, 25);
    const assembly = computeVoteResults({
      mode: VoteMode.ASSEMBLY_RECORD,
      quorum: { measure: QuorumMeasure.UNIT_SHARE, threshold: HALF, comparator: STRICT },
      questions: [QUESTION()],
      ...data,
    });
    expect(assembly.quorumMet).toBe(true); // 60/100 > 1/2
    expect(assembly.questionResults[0].majorityMet).toBe(true); // 35/60 > 1/2
    expect(assembly.questionResults[0].winningOptionId).toBe('yes');

    const perRollam = computeVoteResults({
      mode: VoteMode.PER_ROLLAM,
      quorum: null,
      questions: [QUESTION({ basis: MajorityDenominatorBasis.ALL_VOTES })],
      ...data,
    });
    expect(perRollam.quorumMet).toBeNull();
    expect(perRollam.questionResults[0].majorityMet).toBe(false); // 35/100 is not > 1/2
    expect(perRollam.questionResults[0].winningOptionId).toBeNull();
    expect(perRollam.questionResults[0].majorityDenominator.eq(Rational.one())).toBe(true);
  });

  it('exactly 50% participation fails a STRICT_GREATER quorum (§ 1206/2 boundary)', () => {
    const result = computeVoteResults({
      mode: VoteMode.ASSEMBLY_RECORD,
      quorum: { measure: QuorumMeasure.UNIT_SHARE, threshold: HALF, comparator: STRICT },
      questions: [QUESTION()],
      ...building(100, 50, 0),
    });
    expect(result.quorumMet).toBe(false);
  });

  it('AT_LEAST 2/3 met exactly passes; STRICT_GREATER 2/3 does not', () => {
    const data = building(100, 40, 20); // 40/60 = exactly 2/3 of votes cast
    const atLeast = computeVoteResults({
      mode: VoteMode.ASSEMBLY_RECORD,
      quorum: { measure: QuorumMeasure.UNIT_SHARE, threshold: HALF, comparator: STRICT },
      questions: [QUESTION({ threshold: { num: 2, den: 3 }, comparator: AT_LEAST })],
      ...data,
    });
    expect(atLeast.questionResults[0].majorityMet).toBe(true);
    const strict = computeVoteResults({
      mode: VoteMode.ASSEMBLY_RECORD,
      quorum: { measure: QuorumMeasure.UNIT_SHARE, threshold: HALF, comparator: STRICT },
      questions: [QUESTION({ threshold: { num: 2, den: 3 }, comparator: STRICT })],
      ...data,
    });
    expect(strict.questionResults[0].majorityMet).toBe(false);
  });

  it('UNANIMITY over ALL_VOTES fails on one silent owner, passes at 100%', () => {
    const unanimityRules = { basis: MajorityDenominatorBasis.ALL_VOTES, threshold: { num: 1, den: 1 }, comparator: AT_LEAST };
    expect(computeVoteResults({
      mode: VoteMode.PER_ROLLAM, quorum: null,
      questions: [QUESTION(unanimityRules)], ...building(100, 99, 0),
    }).questionResults[0].majorityMet).toBe(false);
    expect(computeVoteResults({
      mode: VoteMode.PER_ROLLAM, quorum: null,
      questions: [QUESTION(unanimityRules)], ...building(100, 100, 0),
    }).questionResults[0].majorityMet).toBe(true);
  });

  it('abstention counts in the VOTES_CAST denominator (effectively against)', () => {
    const result = computeVoteResults({
      mode: VoteMode.ASSEMBLY_RECORD,
      quorum: { measure: QuorumMeasure.UNIT_SHARE, threshold: HALF, comparator: STRICT },
      questions: [QUESTION()],
      ...building(100, 30, 20, 10), // 30/60 not > 1/2
    });
    expect(result.questionResults[0].majorityMet).toBe(false);
  });

  it('UNIT_COUNT quorum measure counts units, not weights', () => {
    const data = building(4, 3, 0);
    const result = computeVoteResults({
      mode: VoteMode.ASSEMBLY_RECORD,
      quorum: { measure: QuorumMeasure.UNIT_COUNT, threshold: HALF, comparator: STRICT },
      questions: [QUESTION()],
      ...data,
    });
    expect(result.quorumMet).toBe(true); // 3 of 4 units
  });

  it('ties yield no winner and no majority', () => {
    const result = computeVoteResults({
      mode: VoteMode.ASSEMBLY_RECORD,
      quorum: { measure: QuorumMeasure.UNIT_SHARE, threshold: HALF, comparator: STRICT },
      questions: [QUESTION()],
      ...building(100, 30, 30),
    });
    expect(result.questionResults[0].winningOptionId).toBeNull();
    expect(result.questionResults[0].majorityMet).toBe(false);
  });

  it('ASSOCIATION_OWNED units are excluded from every denominator', () => {
    const data = building(4, 2, 0);
    data.electorate[3] = { unitId: 'u3', ineligibleReason: 'ASSOCIATION_OWNED', weightNum: 1, weightDen: 4 };
    const result = computeVoteResults({
      mode: VoteMode.PER_ROLLAM, quorum: null,
      questions: [QUESTION({ basis: MajorityDenominatorBasis.ALL_VOTES })],
      ...data,
    });
    // total = 3/4; yes = 2/4 = 1/2 > 1/2 × 3/4 = 3/8 → passes
    expect(result.totalVotesWeight.eq(Rational.from(3, 4))).toBe(true);
    expect(result.totalVotesUnitCount).toBe(3);
    expect(result.questionResults[0].majorityMet).toBe(true);
  });

  it('units without a representative still count in the ALL_VOTES denominator (§ 1214)', () => {
    const data = building(4, 2, 0);
    data.electorate[2] = { unitId: 'u2', ineligibleReason: 'NO_REPRESENTATIVE', weightNum: 1, weightDen: 4 };
    data.electorate[3] = { unitId: 'u3', ineligibleReason: 'MISSING_OWNERSHIP', weightNum: 1, weightDen: 4 };
    const result = computeVoteResults({
      mode: VoteMode.PER_ROLLAM, quorum: null,
      questions: [QUESTION({ basis: MajorityDenominatorBasis.ALL_VOTES })],
      ...data,
    });
    expect(result.totalVotesWeight.eq(Rational.one())).toBe(true);
    expect(result.totalVotesUnitCount).toBe(4);
    expect(result.questionResults[0].majorityDenominator.eq(Rational.one())).toBe(true);
    expect(result.questionResults[0].majorityMet).toBe(false); // 2/4 = exactly 1/2, not > 1/2
  });

  it('exact fractions: three 1/3-units all voting yes give participation exactly 1', () => {
    const electorate = [0, 1, 2].map((i) => ({ unitId: `u${i}`, ineligibleReason: null, weightNum: 1, weightDen: 3 }));
    const ballots = [0, 1, 2].map((i) => ({ ballotId: `b${i}`, unitId: `u${i}` }));
    const answers = ballots.map((b) => ({ ballotId: b.ballotId, questionId: 'q1', optionId: 'yes' }));
    const result = computeVoteResults({
      mode: VoteMode.PER_ROLLAM, quorum: null,
      questions: [QUESTION({ basis: MajorityDenominatorBasis.ALL_VOTES })],
      electorate, ballots, answers,
    });
    expect(result.participationWeight.eq(Rational.one())).toBe(true); // 0.3333×3 would fail this
  });
});
