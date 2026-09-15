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

export const majorityRuleTypeEnum = pgEnum('majority_rule_type', [
  'SIMPLE_MAJORITY',
  'QUALIFIED_MAJORITY',
  'UNANIMITY',
]);

export const voteModeEnum = pgEnum('vote_mode', [
  'PER_ROLLAM',
  'ASSEMBLY_RECORD',
]);

export const thresholdComparatorEnum = pgEnum('threshold_comparator', [
  'STRICT_GREATER',
  'AT_LEAST',
]);

export const majorityDenominatorBasisEnum = pgEnum(
  'majority_denominator_basis',
  ['VOTES_CAST', 'ALL_VOTES'],
);

export const questionTypeEnum = pgEnum('question_type', [
  'YES_NO',
  'SINGLE_CHOICE',
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
  ['NO_REPRESENTATIVE', 'MISSING_OWNERSHIP', 'ASSOCIATION_OWNED'],
);

export const ballotCastMethodEnum = pgEnum('ballot_cast_method', [
  'DIRECT',
  'BOARD_PROXY',
]);

export const voteResultStatusEnum = pgEnum('vote_result_status', [
  'COMPUTED',
  'FAILED',
]);

export const voteDocumentStatusEnum = pgEnum('vote_document_status', [
  'PENDING',
  'UPLOADED',
]);

export const voteDocumentKindEnum = pgEnum('vote_document_kind', [
  'VOTE',
  'BALLOT',
]);
