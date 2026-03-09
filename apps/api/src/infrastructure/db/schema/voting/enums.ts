import { pgEnum } from 'drizzle-orm/pg-core';

export const voteStatusEnum = pgEnum('vote_status', [
  'DRAFT',
  'SCHEDULED',
  'OPEN',
  'CLOSED',
  'CANCELLED',
]);

export const voteWeightBasisEnum = pgEnum('vote_weight_basis', [
  'UNIT_SHARE',
  'ONE_UNIT_ONE_VOTE',
]);

export const quorumMeasureEnum = pgEnum('quorum_measure', [
  'UNIT_SHARE',
  'UNIT_COUNT',
]);

export const quorumElectorateBasisEnum = pgEnum('quorum_electorate_basis', [
  'ALL_UNITS',
  'ELIGIBLE_UNITS_ONLY',
]);

export const majorityRuleTypeEnum = pgEnum('majority_rule_type', [
  'SIMPLE_MAJORITY',
  'QUALIFIED_MAJORITY',
]);

export const questionTypeEnum = pgEnum('question_type', [
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
]);

export const voteUnitConsentStatusEnum = pgEnum('vote_unit_consent_status', [
  'VALID',
  'REVOKED',
]);

export const electorateEligibilityStatusEnum = pgEnum(
  'electorate_eligibility_status',
  ['ELIGIBLE', 'INELIGIBLE'],
);

export const electorateIneligibleReasonEnum = pgEnum(
  'electorate_ineligible_reason',
  ['NO_REPRESENTATIVE', 'MISSING_OWNERSHIP'],
);

export const ballotCastMethodEnum = pgEnum('ballot_cast_method', [
  'DIRECT',
  'BOARD_PROXY',
]);

export const voteResultStatusEnum = pgEnum('vote_result_status', [
  'COMPUTED',
  'FAILED',
]);
