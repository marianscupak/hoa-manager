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

export enum MajorityRuleType {
  SIMPLE_MAJORITY = 'SIMPLE_MAJORITY',
  QUALIFIED_MAJORITY = 'QUALIFIED_MAJORITY',
  UNANIMITY = 'UNANIMITY',
}

export enum VoteMode {
  PER_ROLLAM = 'PER_ROLLAM',
  ASSEMBLY_RECORD = 'ASSEMBLY_RECORD',
}

export enum ThresholdComparator {
  STRICT_GREATER = 'STRICT_GREATER',
  AT_LEAST = 'AT_LEAST',
}

export enum MajorityDenominatorBasis {
  VOTES_CAST = 'VOTES_CAST',
  ALL_VOTES = 'ALL_VOTES',
}

export interface FractionValue {
  num: number;
  den: number;
}

export interface QuorumRule {
  measure: QuorumMeasure;
  threshold: FractionValue;
  comparator: ThresholdComparator;
}

export interface VoteRuleset {
  weightBasis: VoteWeightBasis;
  quorum: QuorumRule | null;
  majorityRuleType: MajorityRuleType;
  majorityDenominatorBasis: MajorityDenominatorBasis;
  majorityThreshold: FractionValue;
  majorityComparator: ThresholdComparator;
  allowAbstain: boolean;
  acknowledgedNonStatutory: boolean;
}

export enum VoteQuestionType {
  YES_NO = 'YES_NO',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
}

export enum VoteOptionSemantic {
  YES = 'YES',
  NO = 'NO',
  ABSTAIN = 'ABSTAIN',
  CUSTOM = 'CUSTOM',
}

export interface VoteOption {
  id: string;
  label: string;
  sortOrder: number;
  optionKey: VoteOptionSemantic;
}

export interface VoteQuestion {
  id: string;
  title: string;
  description: string | null;
  type: VoteQuestionType;
  sortOrder: number;
  options: VoteOption[];
  rulesetOverride?: VoteRuleset;
}

export enum VoteUnitConsentStatus {
  VALID = 'VALID',
  REVOKED = 'REVOKED',
}

export enum OwningUnitStatus {
  READY = 'READY',
  REQUIRES_DELEGATION = 'REQUIRES_DELEGATION',
  DELEGATED = 'DELEGATED',
  INELIGIBLE = 'INELIGIBLE',
  VOTED = 'VOTED',
}

export enum ElectorateEligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE = 'INELIGIBLE',
}

export enum ElectorateIneligibleReason {
  NO_REPRESENTATIVE = 'NO_REPRESENTATIVE',
  MISSING_OWNERSHIP = 'MISSING_OWNERSHIP',
  ASSOCIATION_OWNED = 'ASSOCIATION_OWNED',
}

export interface ElectorateUnit {
  unitId: string;
  representativeMembershipId: string | null;
  eligibilityStatus: ElectorateEligibilityStatus;
  ineligibleReason: ElectorateIneligibleReason | null;
  weightNum: number;
  weightDen: number;
}
