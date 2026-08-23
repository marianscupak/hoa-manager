import { Rational } from '@/shared/domain/rational';

import {
  MajorityDenominatorBasis, MajorityRuleType, QuorumMeasure,
  ThresholdComparator, VoteMode, VoteWeightBasis,
  type FractionValue, type QuorumRule, type VoteRuleset,
} from './vote.types';

export interface ThresholdBar {
  threshold: FractionValue;
  comparator: ThresholdComparator;
}

export type Tier1Code =
  | 'ASSEMBLY_QUORUM_BELOW_FLOOR'
  | 'ASSEMBLY_QUORUM_MISSING'
  | 'PER_ROLLAM_QUORUM_PRESENT'
  | 'PER_ROLLAM_BASIS_NOT_ALL_VOTES'
  | 'MAJORITY_BELOW_FLOOR'
  | 'THRESHOLD_INVALID';

export type Tier3Deviation = 'ONE_UNIT_ONE_VOTE' | 'UNIT_COUNT_QUORUM';

export const RULESET_CITATIONS: Record<Tier1Code, string> = {
  ASSEMBLY_QUORUM_BELOW_FLOOR: 'NOZ § 1206 odst. 2',
  ASSEMBLY_QUORUM_MISSING: 'NOZ § 1206 odst. 2',
  PER_ROLLAM_QUORUM_PRESENT: 'NOZ § 1210–1214',
  PER_ROLLAM_BASIS_NOT_ALL_VOTES: 'NOZ § 1214',
  MAJORITY_BELOW_FLOOR: 'NOZ § 1206 odst. 2 / § 1214',
  THRESHOLD_INVALID: 'NOZ § 1206 odst. 2 / § 1214',
};

const STATUTORY_FLOOR: ThresholdBar = {
  threshold: { num: 1, den: 2 },
  comparator: ThresholdComparator.STRICT_GREATER,
};

const isValidFraction = (f: FractionValue): boolean =>
  Number.isInteger(f.num) && Number.isInteger(f.den) && f.num > 0 && f.den > 0 && f.num <= f.den;

export function barAtLeastAsStrict(a: ThresholdBar, b: ThresholdBar): boolean {
  const ta = Rational.from(a.threshold.num, a.threshold.den);
  const tb = Rational.from(b.threshold.num, b.threshold.den);
  const cmp = ta.compare(tb);
  if (cmp !== 0) return cmp > 0;
  return !(
    a.comparator === ThresholdComparator.AT_LEAST &&
    b.comparator === ThresholdComparator.STRICT_GREATER
  );
}

export function materializeRuleset(
  shape: Omit<VoteRuleset, 'majorityThreshold' | 'majorityComparator'> & {
    majorityThreshold?: FractionValue;
    majorityComparator?: ThresholdComparator;
  },
): VoteRuleset {
  switch (shape.majorityRuleType) {
    case MajorityRuleType.SIMPLE_MAJORITY:
      return {
        ...shape,
        majorityThreshold: { num: 1, den: 2 },
        majorityComparator: ThresholdComparator.STRICT_GREATER,
      };
    case MajorityRuleType.UNANIMITY:
      return {
        ...shape,
        majorityDenominatorBasis: MajorityDenominatorBasis.ALL_VOTES,
        majorityThreshold: { num: 1, den: 1 },
        majorityComparator: ThresholdComparator.AT_LEAST,
      };
    case MajorityRuleType.QUALIFIED_MAJORITY:
      if (!shape.majorityThreshold || !shape.majorityComparator) {
        throw new Error('QUALIFIED_MAJORITY requires threshold and comparator');
      }
      return {
        ...shape,
        majorityThreshold: shape.majorityThreshold,
        majorityComparator: shape.majorityComparator,
      };
  }
}

const tier1 = (code: Tier1Code) => ({ code, citation: RULESET_CITATIONS[code] });

export function validateRuleset(
  mode: VoteMode,
  r: VoteRuleset,
): { tier1: { code: Tier1Code; citation: string }[]; tier3: Tier3Deviation[] } {
  const t1: { code: Tier1Code; citation: string }[] = [];
  const t3: Tier3Deviation[] = [];

  if (!isValidFraction(r.majorityThreshold) || (r.quorum !== null && !isValidFraction(r.quorum.threshold))) {
    t1.push(tier1('THRESHOLD_INVALID'));
    return { tier1: t1, tier3: t3 };
  }

  const majorityBar: ThresholdBar = { threshold: r.majorityThreshold, comparator: r.majorityComparator };
  if (!barAtLeastAsStrict(majorityBar, STATUTORY_FLOOR)) {
    t1.push(tier1('MAJORITY_BELOW_FLOOR'));
  }

  if (mode === VoteMode.PER_ROLLAM) {
    if (r.quorum !== null) t1.push(tier1('PER_ROLLAM_QUORUM_PRESENT'));
    if (r.majorityDenominatorBasis !== MajorityDenominatorBasis.ALL_VOTES) {
      t1.push(tier1('PER_ROLLAM_BASIS_NOT_ALL_VOTES'));
    }
  } else {
    if (r.quorum === null) {
      t1.push(tier1('ASSEMBLY_QUORUM_MISSING'));
    } else {
      const quorumBar: ThresholdBar = { threshold: r.quorum.threshold, comparator: r.quorum.comparator };
      if (!barAtLeastAsStrict(quorumBar, STATUTORY_FLOOR)) {
        t1.push(tier1('ASSEMBLY_QUORUM_BELOW_FLOOR'));
      }
      if (r.quorum.measure === QuorumMeasure.UNIT_COUNT) t3.push('UNIT_COUNT_QUORUM');
    }
  }

  if (r.weightBasis === VoteWeightBasis.ONE_UNIT_ONE_VOTE) t3.push('ONE_UNIT_ONE_VOTE');

  return { tier1: t1, tier3: t3 };
}

const sameQuorum = (a: QuorumRule | null, b: QuorumRule | null): boolean => {
  if (a === null || b === null) return a === b;
  return (
    a.measure === b.measure &&
    a.comparator === b.comparator &&
    Rational.from(a.threshold.num, a.threshold.den).eq(Rational.from(b.threshold.num, b.threshold.den))
  );
};

export function validateQuestionOverride(
  mode: VoteMode,
  base: VoteRuleset,
  override: VoteRuleset,
): { notStricter: boolean; tier1: { code: Tier1Code; citation: string }[] } {
  const validation = validateRuleset(mode, override);

  if (validation.tier1.some((v) => v.code === 'THRESHOLD_INVALID')) {
    return { notStricter: false, tier1: validation.tier1 };
  }

  const basisRank = (b: MajorityDenominatorBasis) => (b === MajorityDenominatorBasis.ALL_VOTES ? 1 : 0);
  const untouchedDimensionsOk =
    override.weightBasis === base.weightBasis &&
    override.allowAbstain === base.allowAbstain &&
    sameQuorum(override.quorum, base.quorum);
  const basisOk = basisRank(override.majorityDenominatorBasis) >= basisRank(base.majorityDenominatorBasis);
  const barOk = barAtLeastAsStrict(
    { threshold: override.majorityThreshold, comparator: override.majorityComparator },
    { threshold: base.majorityThreshold, comparator: base.majorityComparator },
  );

  return { notStricter: !(untouchedDimensionsOk && basisOk && barOk), tier1: validation.tier1 };
}
