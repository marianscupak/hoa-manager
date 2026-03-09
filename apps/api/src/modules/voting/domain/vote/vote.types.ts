export enum VoteStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum VoteWeightBasis {
  UNIT_SHARE = 'UNIT_SHARE',
  ONE_UNIT_ONE_VOTE = 'ONE_UNIT_ONE_VOTE',
}

export enum QuorumMeasure {
  UNIT_SHARE = 'UNIT_SHARE',
  UNIT_COUNT = 'UNIT_COUNT',
}

export enum QuorumElectorateBasis {
  ALL_UNITS = 'ALL_UNITS',
  ELIGIBLE_UNITS_ONLY = 'ELIGIBLE_UNITS_ONLY',
}

export enum MajorityRuleType {
  SIMPLE_MAJORITY = 'SIMPLE_MAJORITY',
  QUALIFIED_MAJORITY = 'QUALIFIED_MAJORITY',
}

export interface VoteRuleset {
  weightBasis: VoteWeightBasis;
  quorumMeasure: QuorumMeasure;
  quorumElectorateBasis: QuorumElectorateBasis;
  quorumThreshold: number;
  majorityRuleType: MajorityRuleType;
  majorityThreshold: number | null;
  allowAbstain: boolean;
  abstainExcludedFromMajorityDenominator: boolean;
}
