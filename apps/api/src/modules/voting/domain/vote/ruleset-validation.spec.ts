import {
  barAtLeastAsStrict,
  materializeRuleset,
  validateQuestionOverride,
  validateRuleset,
} from './ruleset-validation';
import {
  MajorityDenominatorBasis,
  MajorityRuleType,
  QuorumMeasure,
  ThresholdComparator,
  VoteMode,
  VoteWeightBasis,
  type VoteRuleset,
} from './vote.types';

const HALF = { num: 1, den: 2 };
const STRICT = ThresholdComparator.STRICT_GREATER;
const AT_LEAST = ThresholdComparator.AT_LEAST;

const perRollamStatutory: VoteRuleset = {
  weightBasis: VoteWeightBasis.UNIT_SHARE,
  quorum: null,
  majorityRuleType: MajorityRuleType.SIMPLE_MAJORITY,
  majorityDenominatorBasis: MajorityDenominatorBasis.ALL_VOTES,
  majorityThreshold: HALF,
  majorityComparator: STRICT,
  allowAbstain: true,
  acknowledgedNonStatutory: false,
};

const assemblyStatutory: VoteRuleset = {
  ...perRollamStatutory,
  quorum: {
    measure: QuorumMeasure.UNIT_SHARE,
    threshold: HALF,
    comparator: STRICT,
  },
  majorityDenominatorBasis: MajorityDenominatorBasis.VOTES_CAST,
};

describe('barAtLeastAsStrict', () => {
  it('orders bars correctly at the 1/2 boundary', () => {
    expect(
      barAtLeastAsStrict(
        { threshold: HALF, comparator: STRICT },
        { threshold: HALF, comparator: STRICT },
      ),
    ).toBe(true);
    expect(
      barAtLeastAsStrict(
        { threshold: HALF, comparator: AT_LEAST },
        { threshold: HALF, comparator: STRICT },
      ),
    ).toBe(false);
    expect(
      barAtLeastAsStrict(
        { threshold: HALF, comparator: STRICT },
        { threshold: HALF, comparator: AT_LEAST },
      ),
    ).toBe(true);
    expect(
      barAtLeastAsStrict(
        { threshold: { num: 2, den: 3 }, comparator: AT_LEAST },
        { threshold: HALF, comparator: STRICT },
      ),
    ).toBe(true);
    expect(
      barAtLeastAsStrict(
        { threshold: { num: 49, den: 100 }, comparator: STRICT },
        { threshold: HALF, comparator: STRICT },
      ),
    ).toBe(false);
  });
});

describe('materializeRuleset', () => {
  it('fills SIMPLE and UNANIMITY thresholds', () => {
    const simple = materializeRuleset({
      ...perRollamStatutory,
      majorityThreshold: undefined,
      majorityComparator: undefined,
    });
    expect(simple.majorityThreshold).toEqual(HALF);
    expect(simple.majorityComparator).toBe(STRICT);
    const unanimity = materializeRuleset({
      ...perRollamStatutory,
      majorityRuleType: MajorityRuleType.UNANIMITY,
      majorityDenominatorBasis: MajorityDenominatorBasis.VOTES_CAST,
      majorityThreshold: undefined,
      majorityComparator: undefined,
    });
    expect(unanimity.majorityThreshold).toEqual({ num: 1, den: 1 });
    expect(unanimity.majorityComparator).toBe(AT_LEAST);
    expect(unanimity.majorityDenominatorBasis).toBe(
      MajorityDenominatorBasis.ALL_VOTES,
    );
  });
});

describe('validateRuleset', () => {
  it('accepts both statutory presets with no findings', () => {
    expect(validateRuleset(VoteMode.PER_ROLLAM, perRollamStatutory)).toEqual({
      tier1: [],
      tier3: [],
    });
    expect(
      validateRuleset(VoteMode.ASSEMBLY_RECORD, assemblyStatutory),
    ).toEqual({ tier1: [], tier3: [] });
  });

  it('tier1: assembly quorum below floor / missing; per-rollam quorum present; wrong basis; low majority', () => {
    const lowQuorum = validateRuleset(VoteMode.ASSEMBLY_RECORD, {
      ...assemblyStatutory,
      quorum: {
        measure: QuorumMeasure.UNIT_SHARE,
        threshold: { num: 3, den: 10 },
        comparator: AT_LEAST,
      },
    });
    expect(lowQuorum.tier1.map((v) => v.code)).toContain(
      'ASSEMBLY_QUORUM_BELOW_FLOOR',
    );
    expect(lowQuorum.tier1[0].citation).toContain('1206');

    expect(
      validateRuleset(VoteMode.ASSEMBLY_RECORD, {
        ...assemblyStatutory,
        quorum: null,
      }).tier1.map((v) => v.code),
    ).toContain('ASSEMBLY_QUORUM_MISSING');
    expect(
      validateRuleset(VoteMode.PER_ROLLAM, {
        ...perRollamStatutory,
        quorum: assemblyStatutory.quorum,
      }).tier1.map((v) => v.code),
    ).toContain('PER_ROLLAM_QUORUM_PRESENT');
    expect(
      validateRuleset(VoteMode.PER_ROLLAM, {
        ...perRollamStatutory,
        majorityDenominatorBasis: MajorityDenominatorBasis.VOTES_CAST,
      }).tier1.map((v) => v.code),
    ).toContain('PER_ROLLAM_BASIS_NOT_ALL_VOTES');
    expect(
      validateRuleset(VoteMode.PER_ROLLAM, {
        ...perRollamStatutory,
        majorityComparator: AT_LEAST,
      }).tier1.map((v) => v.code),
    ).toContain('MAJORITY_BELOW_FLOOR');
    expect(
      validateRuleset(VoteMode.PER_ROLLAM, {
        ...perRollamStatutory,
        majorityThreshold: { num: 0, den: 2 },
      }).tier1.map((v) => v.code),
    ).toContain('THRESHOLD_INVALID');
  });

  it('tier2: raising thresholds and unanimity pass freely', () => {
    expect(
      validateRuleset(VoteMode.PER_ROLLAM, {
        ...perRollamStatutory,
        majorityRuleType: MajorityRuleType.QUALIFIED_MAJORITY,
        majorityThreshold: { num: 3, den: 4 },
        majorityComparator: AT_LEAST,
      }),
    ).toEqual({ tier1: [], tier3: [] });
    expect(
      validateRuleset(VoteMode.ASSEMBLY_RECORD, {
        ...assemblyStatutory,
        majorityRuleType: MajorityRuleType.UNANIMITY,
        majorityDenominatorBasis: MajorityDenominatorBasis.ALL_VOTES,
        majorityThreshold: { num: 1, den: 1 },
        majorityComparator: AT_LEAST,
      }),
    ).toEqual({ tier1: [], tier3: [] });
  });

  it('tier3: one-unit-one-vote and headcount quorum are flagged', () => {
    expect(
      validateRuleset(VoteMode.PER_ROLLAM, {
        ...perRollamStatutory,
        weightBasis: VoteWeightBasis.ONE_UNIT_ONE_VOTE,
      }).tier3,
    ).toEqual(['ONE_UNIT_ONE_VOTE']);
    expect(
      validateRuleset(VoteMode.ASSEMBLY_RECORD, {
        ...assemblyStatutory,
        quorum: {
          measure: QuorumMeasure.UNIT_COUNT,
          threshold: HALF,
          comparator: STRICT,
        },
      }).tier3,
    ).toEqual(['UNIT_COUNT_QUORUM']);
  });
});

describe('validateQuestionOverride', () => {
  it('accepts stricter overrides (qualified 2/3 over ALL_VOTES)', () => {
    const override: VoteRuleset = {
      ...assemblyStatutory,
      majorityRuleType: MajorityRuleType.QUALIFIED_MAJORITY,
      majorityDenominatorBasis: MajorityDenominatorBasis.ALL_VOTES,
      majorityThreshold: { num: 2, den: 3 },
      majorityComparator: AT_LEAST,
    };
    expect(
      validateQuestionOverride(
        VoteMode.ASSEMBLY_RECORD,
        assemblyStatutory,
        override,
      ),
    ).toEqual({ notStricter: false, tier1: [] });
  });

  it('rejects relaxing overrides and non-majority changes', () => {
    expect(
      validateQuestionOverride(
        VoteMode.ASSEMBLY_RECORD,
        {
          ...assemblyStatutory,
          majorityRuleType: MajorityRuleType.QUALIFIED_MAJORITY,
          majorityThreshold: { num: 2, den: 3 },
          majorityComparator: AT_LEAST,
        },
        assemblyStatutory,
      ).notStricter,
    ).toBe(true);

    expect(
      validateQuestionOverride(VoteMode.ASSEMBLY_RECORD, assemblyStatutory, {
        ...assemblyStatutory,
        weightBasis: VoteWeightBasis.ONE_UNIT_ONE_VOTE,
      }).notStricter,
    ).toBe(true);

    expect(
      validateQuestionOverride(VoteMode.PER_ROLLAM, perRollamStatutory, {
        ...perRollamStatutory,
        majorityDenominatorBasis: MajorityDenominatorBasis.VOTES_CAST,
      }).notStricter,
    ).toBe(true);
  });

  it('rejects invalid fractions in override without throwing', () => {
    const result = validateQuestionOverride(
      VoteMode.PER_ROLLAM,
      perRollamStatutory,
      {
        ...perRollamStatutory,
        majorityThreshold: { num: 1, den: 0 },
      },
    );
    expect(result.notStricter).toBe(false);
    expect(result.tier1.map((v) => v.code)).toContain('THRESHOLD_INVALID');
  });
});
