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
  allowCoOwnerIndividualVote: boolean;
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
}

export enum ElectorateEligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE = 'INELIGIBLE',
}

export enum ElectorateIneligibleReason {
  NO_REPRESENTATIVE = 'NO_REPRESENTATIVE',
  MISSING_OWNERSHIP = 'MISSING_OWNERSHIP',
}

export interface ElectorateUnit {
  unitId: string;
  representativeMembershipId: string | null;
  eligibilityStatus: ElectorateEligibilityStatus;
  ineligibleReason: ElectorateIneligibleReason | null;
  votingWeight: number;
}
