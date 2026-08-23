import { voteRulesets } from '@/infrastructure/db/schema';
import {
  type MajorityDenominatorBasis,
  type MajorityRuleType,
  type QuorumMeasure,
  type ThresholdComparator,
  type VoteRuleset,
  type VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';

/** DB row → domain ruleset. Shared by the write and read repositories. */
export function mapRulesetRow(
  r: typeof voteRulesets.$inferSelect,
): VoteRuleset {
  return {
    weightBasis: r.weightBasis as VoteWeightBasis,
    quorum:
      r.quorumMeasure &&
      r.quorumThresholdNum !== null &&
      r.quorumThresholdDen !== null &&
      r.quorumComparator
        ? {
            measure: r.quorumMeasure as QuorumMeasure,
            threshold: { num: r.quorumThresholdNum, den: r.quorumThresholdDen },
            comparator: r.quorumComparator as ThresholdComparator,
          }
        : null,
    majorityRuleType: r.majorityRuleType as MajorityRuleType,
    majorityDenominatorBasis:
      r.majorityDenominatorBasis as MajorityDenominatorBasis,
    majorityThreshold: {
      num: r.majorityThresholdNum,
      den: r.majorityThresholdDen,
    },
    majorityComparator: r.majorityComparator as ThresholdComparator,
    allowAbstain: r.allowAbstain,
    acknowledgedNonStatutory: r.acknowledgedNonStatutory,
  };
}

/** Domain ruleset → the rule columns of `vote_rulesets`. */
export function mapRulesetColumns(
  ruleset: VoteRuleset,
): Omit<
  typeof voteRulesets.$inferInsert,
  'id' | 'tenantId' | 'voteId' | 'questionId' | 'createdAt' | 'updatedAt'
> {
  return {
    weightBasis: ruleset.weightBasis,
    quorumMeasure: ruleset.quorum?.measure ?? null,
    quorumThresholdNum: ruleset.quorum?.threshold.num ?? null,
    quorumThresholdDen: ruleset.quorum?.threshold.den ?? null,
    quorumComparator: ruleset.quorum?.comparator ?? null,
    majorityRuleType: ruleset.majorityRuleType,
    majorityDenominatorBasis: ruleset.majorityDenominatorBasis,
    majorityThresholdNum: ruleset.majorityThreshold.num,
    majorityThresholdDen: ruleset.majorityThreshold.den,
    majorityComparator: ruleset.majorityComparator,
    allowAbstain: ruleset.allowAbstain,
    acknowledgedNonStatutory: ruleset.acknowledgedNonStatutory,
  };
}
