import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { type QuestionOutcome } from '@/modules/voting/domain/vote/question-outcome';
import {
  MajorityDenominatorBasis,
  MajorityRuleType,
  QuorumMeasure,
  ThresholdComparator,
  VoteMode,
  VoteOptionSemantic,
  VoteQuestionType,
  VoteStatus,
  VoteWeightBasis,
  OwningUnitStatus,
  ElectorateIneligibleReason,
} from '@/modules/voting/domain/vote/vote.types';
import { Rational } from '@/shared/domain/rational';

const voteBaseSchema = z.object({
  title: z.string(),
  description: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v : null)),
  scheduledFrom: z
    .string()
    .datetime()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  scheduledTo: z
    .string()
    .datetime()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

export const createVoteSchema = voteBaseSchema.extend({
  mode: z.enum(VoteMode).default(VoteMode.PER_ROLLAM),
});

// `mode` is immutable after create — optional here, and the handler rejects a
// value that differs from the stored one.
export const updateVoteSchema = voteBaseSchema.extend({
  mode: z.enum(VoteMode).optional(),
});

export class CreateVoteDto extends createZodDto(createVoteSchema) {}
export class UpdateVoteDto extends createZodDto(updateVoteSchema) {}

export class CreateVoteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  description!: string | null;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: false,
    nullable: true,
  })
  scheduledFrom!: Date | null;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: false,
    nullable: true,
  })
  scheduledTo!: Date | null;

  @ApiProperty()
  status!: VoteStatus;

  @ApiProperty({ enum: VoteMode })
  mode!: VoteMode;
}

const fractionDtoSchema = z.object({
  num: z.number().int().min(1),
  den: z.number().int().min(1),
});

export const setVoteRulesetSchema = z
  .object({
    weightBasis: z.enum(VoteWeightBasis),
    quorum: z
      .object({
        measure: z.enum(QuorumMeasure),
        threshold: fractionDtoSchema,
        comparator: z.enum(ThresholdComparator),
      })
      .nullable(),
    majorityRuleType: z.enum(MajorityRuleType),
    majorityDenominatorBasis: z.enum(MajorityDenominatorBasis),
    // Derived for SIMPLE_MAJORITY (>1/2) and UNANIMITY (>=1/1); only a
    // QUALIFIED_MAJORITY has to state its own bar.
    majorityThreshold: fractionDtoSchema.optional(),
    majorityComparator: z.enum(ThresholdComparator).optional(),
    allowAbstain: z.boolean(),
    acknowledgedNonStatutory: z.boolean().default(false),
  })
  .refine(
    (data) =>
      data.majorityRuleType !== MajorityRuleType.QUALIFIED_MAJORITY ||
      (!!data.majorityThreshold && !!data.majorityComparator),
    {
      message:
        'QUALIFIED_MAJORITY requires majorityThreshold and majorityComparator.',
      path: ['majorityThreshold'],
    },
  );

export class SetVoteRulesetDto extends createZodDto(setVoteRulesetSchema) {}

export class FractionDto {
  @ApiProperty()
  num!: string;

  @ApiProperty()
  den!: string;

  @ApiProperty()
  decimal!: string;
}

/** Exact fraction plus a rounded decimal for display. */
export const toFractionDto = (value: Rational): FractionDto => ({
  num: value.num.toString(),
  den: value.den.toString(),
  decimal: value.toDecimalString(4),
});

/**
 * `part / total` as a percentage string with 2 decimals. Cross-multiplies
 * rather than dividing, so no precision is lost before the final rounding.
 */
export const toPercentString = (part: Rational, total: Rational): string =>
  total.isZero()
    ? '0.00'
    : Rational.from(part.num * total.den, part.den * total.num)
        .mul(Rational.from(100, 1))
        .toDecimalString(2);

export class RulesetFractionDto {
  @ApiProperty()
  num!: number;

  @ApiProperty()
  den!: number;
}

export class QuorumRuleResponseDto {
  @ApiProperty({ enum: QuorumMeasure })
  measure!: QuorumMeasure;

  @ApiProperty({ type: RulesetFractionDto })
  threshold!: RulesetFractionDto;

  @ApiProperty({ enum: ThresholdComparator })
  comparator!: ThresholdComparator;
}

export class SetVoteRulesetResponseDto {
  @ApiProperty({ enum: VoteWeightBasis })
  weightBasis!: VoteWeightBasis;

  @ApiProperty({ type: QuorumRuleResponseDto, nullable: true })
  quorum!: QuorumRuleResponseDto | null;

  @ApiProperty({ enum: MajorityRuleType })
  majorityRuleType!: MajorityRuleType;

  @ApiProperty({ enum: MajorityDenominatorBasis })
  majorityDenominatorBasis!: MajorityDenominatorBasis;

  @ApiProperty({ type: RulesetFractionDto })
  majorityThreshold!: RulesetFractionDto;

  @ApiProperty({ enum: ThresholdComparator })
  majorityComparator!: ThresholdComparator;

  @ApiProperty()
  allowAbstain!: boolean;

  @ApiProperty()
  acknowledgedNonStatutory!: boolean;
}

export const createVoteQuestionOptionSchema = z.object({
  label: z.string().min(1),
  sortOrder: z.number().int().optional(),
});
export class CreateVoteQuestionOptionDto extends createZodDto(
  createVoteQuestionOptionSchema,
) {}

export const createVoteQuestionSchema = z
  .object({
    // Deliberately not `.min(1)`: the portal creates a question the moment
    // the chair clicks "add", before they have typed a title. The title is
    // required to schedule, not to draft (see `VoteAggregate.schedule`).
    title: z.string(),
    description: z
      .string()
      .optional()
      .transform((v) => v ?? null),
    type: z.nativeEnum(VoteQuestionType),
    sortOrder: z.number().int().optional(),
    options: z.array(createVoteQuestionOptionSchema).optional(),
    rulesetOverride: setVoteRulesetSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.type === VoteQuestionType.YES_NO) {
        return !data.options || data.options.length === 0;
      }
      return true;
    },
    {
      message: 'YES_NO cannot have options.',
      path: ['options'],
    },
  );
export const setUnitAttendanceSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT']),
  /** The entitled voter, when they are an owner on record. */
  voterOwnerId: z.uuid().nullish(),
  /** A proxy holder who is not an owner — provenance only, never authority. */
  voterNote: z.string().trim().min(1).max(200).nullish(),
});
export class SetUnitAttendanceDto extends createZodDto(
  setUnitAttendanceSchema,
) {}

export const recordAssemblyBallotSchema = z.object({
  answers: z.array(
    z.object({ questionId: z.uuid(), optionId: z.uuid() }),
  ),
});
export class RecordAssemblyBallotDto extends createZodDto(
  recordAssemblyBallotSchema,
) {}

export class CreateVoteQuestionDto extends createZodDto(
  createVoteQuestionSchema,
) {}

export class UpdateVoteQuestionOptionDto extends CreateVoteQuestionOptionDto {}
export class UpdateVoteQuestionDto extends CreateVoteQuestionDto {}

export class VoteOptionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ enum: VoteOptionSemantic })
  optionKey!: VoteOptionSemantic;
}

export class VoteQuestionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  description!: string | null;

  @ApiProperty({ enum: VoteQuestionType })
  type!: VoteQuestionType;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ type: [VoteOptionResponseDto] })
  options!: VoteOptionResponseDto[];

  @ApiProperty({
    type: SetVoteRulesetResponseDto,
    required: false,
    nullable: true,
  })
  rulesetOverride!: SetVoteRulesetResponseDto | null;

  @ApiProperty({
    type: SetVoteRulesetResponseDto,
    required: false,
    nullable: true,
  })
  effectiveRuleset!: SetVoteRulesetResponseDto | null;
}

export const requestDocumentUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  // .min(1) rather than .positive(): zod v4's native toJSONSchema (used by
  // nestjs-zod) emits `exclusiveMinimum` as a JSON-Schema-2020-12 number,
  // which orval rejects against our declared OpenAPI 3.0 spec (which
  // requires exclusiveMinimum to be boolean). min(1) on an integer is
  // equivalent to "positive" and only emits an inclusive `minimum`.
  sizeBytes: z.number().int().min(1),
});

export class RequestDocumentUploadDto extends createZodDto(
  requestDocumentUploadSchema,
) {}

export class RequestDocumentUploadResponseDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  uploadUrl!: string;
}

export class VoteDocumentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  contentType!: string;

  @ApiProperty()
  sizeBytes!: number;

  @ApiProperty({ type: 'string', format: 'date-time' })
  uploadedAt!: Date;
}

export class DocumentDownloadUrlResponseDto {
  @ApiProperty()
  downloadUrl!: string;
}

export const requestBallotAttachmentUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(127),
  // See requestDocumentUploadSchema above: .min(1) rather than .positive(),
  // since zod v4's native toJSONSchema emits `exclusiveMinimum` as a
  // JSON-Schema-2020-12 number, which orval rejects against our declared
  // OpenAPI 3.0 spec (which requires exclusiveMinimum to be boolean).
  sizeBytes: z.number().int().min(1),
});

export class RequestBallotAttachmentUploadDto extends createZodDto(
  requestBallotAttachmentUploadSchema,
) {}

export class RequestBallotAttachmentUploadResponseDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  uploadUrl!: string;
}

export class VoteDetailResponseDto extends CreateVoteResponseDto {
  @ApiProperty({
    type: SetVoteRulesetResponseDto,
    required: false,
    nullable: true,
  })
  ruleset!: SetVoteRulesetResponseDto | null;

  @ApiProperty({ type: [VoteQuestionResponseDto] })
  questions!: VoteQuestionResponseDto[];

  @ApiProperty({ type: [VoteDocumentResponseDto] })
  documents!: VoteDocumentResponseDto[];
}

export class VoterSummaryDto {
  @ApiProperty()
  canVote!: boolean;

  @ApiProperty({ required: false })
  requiresDelegation?: boolean;

  @ApiProperty()
  isDelegated!: boolean;

  @ApiProperty()
  hasVoted!: boolean;
}

export class QuestionOutcomeDto {
  @ApiProperty()
  questionId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'WINNER', 'NOT_DECIDED'] })
  outcome!: QuestionOutcome;

  @ApiProperty({ type: 'string', nullable: true })
  winningOptionLabel!: string | null;
}

export class VoteListItemResponseDto extends CreateVoteResponseDto {
  @ApiProperty({ type: VoterSummaryDto, required: false, nullable: true })
  voterSummary?: VoterSummaryDto | null;

  @ApiProperty({ type: [QuestionOutcomeDto], required: false })
  questionOutcomes?: QuestionOutcomeDto[];
}

export class OwningUnitStatusDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  share!: string;

  @ApiProperty({ enum: OwningUnitStatus })
  status!: OwningUnitStatus;

  @ApiProperty({
    enum: ElectorateIneligibleReason,
    required: false,
    nullable: true,
  })
  ineligibleReason?: ElectorateIneligibleReason | null;
}

/**
 * Voting power this member can currently cast, against the association's
 * total. Both are exact rational sums rendered to 4 decimals — never float
 * arithmetic.
 */
export class TotalVotingPowerDto {
  @ApiProperty({ description: 'Decimal string, 4 places' })
  value!: string;

  @ApiProperty({ description: 'Decimal string, 4 places' })
  maximum!: string;
}

export class VoterStatusResponseDto {
  @ApiProperty()
  canVote!: boolean;

  @ApiProperty({ type: TotalVotingPowerDto })
  totalVotingPower!: TotalVotingPowerDto;

  @ApiProperty({ type: [OwningUnitStatusDto] })
  owningUnits!: OwningUnitStatusDto[];
}

export class ConsentPreviewResponseDto {
  @ApiProperty({
    description:
      'Whether recording this consent would leave the unit with nobody ' +
      'authorised to vote it, because no candidate would hold a share ' +
      'majority afterwards.',
  })
  wouldLeaveUnitWithoutRepresentative!: boolean;
}

export class DelegationCandidateDto {
  @ApiProperty()
  membershipId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  hasDelegatedToRequester!: boolean;

  @ApiProperty()
  isEligible!: boolean;

  @ApiProperty()
  isUnitOwner!: boolean;
}

export const createVoteConsentSchema = z.object({
  unitId: z.string().uuid(),
  delegateMembershipId: z.string().uuid(),
  // Self-service callers omit this — the grantor is resolved from their own
  // membership. Admins/board members recording a paper POA send the
  // grantor's ownerId directly, since the grantor may have no user account
  // (e.g. an SJM spouse).
  fromOwnerId: z.string().uuid().optional(),
});

export class CreateVoteConsentDto extends createZodDto(
  createVoteConsentSchema,
) {}

export class VoteConsentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  voteId!: string;

  @ApiProperty()
  voteTitle!: string;

  @ApiProperty()
  voteStatus!: VoteStatus;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: false,
    nullable: true,
  })
  voteScheduledFrom!: Date | null;

  @ApiProperty()
  unitId!: string;

  @ApiProperty()
  unitName!: string;

  @ApiProperty()
  fromOwnerId!: string;

  @ApiProperty()
  fromOwnerName!: string;

  @ApiProperty()
  toMembershipId!: string;

  @ApiProperty()
  toDelegateName!: string;

  @ApiProperty()
  recordedByMembershipId!: string | null;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  createdAt!: Date;
}

// ── Ballot Submission ──────────────────────────────────────

export const submitBallotAnswerSchema = z.object({
  questionId: z.string().uuid(),
  optionId: z.string().uuid(),
});

export const submitBallotUnitSchema = z.object({
  unitId: z.string().uuid(),
  answers: z.array(submitBallotAnswerSchema).min(1),
});

export const submitBallotSchema = z.object({
  ballots: z.array(submitBallotUnitSchema).min(1),
});

export class SubmitBallotDto extends createZodDto(submitBallotSchema) {}

export class SubmitBallotResponseDto {
  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  submittedAt!: Date;
}

export const recordPaperBallotSchema = z.object({
  unitId: z.uuid(),
  signerOwnerId: z.uuid(),
  attachmentDocumentId: z.uuid(),
  answers: z
    .array(z.object({ questionId: z.uuid(), optionId: z.uuid() }))
    .min(1),
});

export class RecordPaperBallotDto extends createZodDto(
  recordPaperBallotSchema,
) {}

// ── Vote Results ──────────────────────────────────────

export class VoteOptionResultDto {
  @ApiProperty()
  optionId!: string;

  @ApiProperty({ type: FractionDto })
  voteWeight!: FractionDto;

  @ApiProperty()
  percent!: string;

  @ApiProperty()
  voteUnitCount!: number;
}

export class VoteQuestionResultDto {
  @ApiProperty()
  questionId!: string;

  @ApiProperty()
  majorityMet!: boolean;

  @ApiProperty({ type: 'string', nullable: true })
  winningOptionId!: string | null;

  @ApiProperty({ type: RulesetFractionDto })
  majorityThreshold!: RulesetFractionDto;

  @ApiProperty({ enum: ThresholdComparator })
  majorityComparator!: ThresholdComparator;

  @ApiProperty({ type: FractionDto })
  majorityDenominator!: FractionDto;

  @ApiProperty({ type: [VoteOptionResultDto] })
  optionResults!: VoteOptionResultDto[];
}

export class VoteResultsResponseDto {
  @ApiProperty({ enum: ['COMPUTED', 'FAILED'] })
  resultStatus!: 'COMPUTED' | 'FAILED';

  /** `null` for per-rollam votes, which have no quorum by law. */
  @ApiProperty({ type: 'boolean', nullable: true })
  quorumMet!: boolean | null;

  @ApiProperty({ type: FractionDto })
  participationWeight!: FractionDto;

  @ApiProperty()
  participationPercent!: string;

  @ApiProperty()
  participationUnitCount!: number;

  /**
   * Total weight of the countable electorate (every unit except
   * association-owned ones) — the statutory "all votes" denominator, not
   * the weight of the votes actually cast.
   */
  @ApiProperty({ type: FractionDto })
  totalVotesWeight!: FractionDto;

  @ApiProperty()
  totalVotesUnitCount!: number;

  @ApiProperty({ type: 'string', format: 'date-time' })
  computedAt!: Date;

  @ApiProperty({ type: [VoteQuestionResultDto] })
  questionResults!: VoteQuestionResultDto[];
}

export class VoteTurnoutResponseDto {
  @ApiProperty()
  participationUnitCount!: number;

  @ApiProperty()
  eligibleUnitCount!: number;

  @ApiProperty({ type: FractionDto })
  participationWeight!: FractionDto;

  @ApiProperty({ type: FractionDto })
  eligibleWeight!: FractionDto;

  /**
   * The statutory "all votes" denominator — every unit in the snapshot
   * except association-owned ones, matching `computeVoteResults`, so
   * mid-vote turnout and the results page never quote different totals.
   */
  @ApiProperty()
  totalVotesUnitCount!: number;

  @ApiProperty({ type: FractionDto })
  totalVotesWeight!: FractionDto;

  @ApiProperty()
  participationPercent!: string;

  /**
   * Null for PER_ROLLAM votes, which have no quorum — the same three-state
   * semantics `VoteResultsResponseDto.quorumMet` already uses, so the portal
   * can share one rendering rule between live and closed views.
   */
  @ApiProperty({ type: Boolean, nullable: true })
  quorumMet!: boolean | null;
}

// ── Vote Running Tally (board/admin/auditor only) ───────

export class VoteTallyOptionDto {
  @ApiProperty()
  optionId!: string;

  @ApiProperty()
  voteUnitCount!: number;

  @ApiProperty({ type: FractionDto })
  voteWeight!: FractionDto;
}

export class VoteTallyQuestionDto {
  @ApiProperty()
  questionId!: string;

  /**
   * The denominator this question's majority will be measured against, so a
   * provisional share is directly comparable to the threshold that will
   * decide it. Zero when nothing countable has been cast yet.
   */
  @ApiProperty({ type: FractionDto })
  majorityDenominator!: FractionDto;

  @ApiProperty({ type: [VoteTallyOptionDto] })
  options!: VoteTallyOptionDto[];
}

/**
 * Provisional standings for an open vote. Gated to ADMIN, BOARD_MEMBER and
 * AUDITOR as a whole resource rather than as conditional fields on a
 * shared response — a board-only field on an all-roles endpoint is exactly
 * the leak this split avoids.
 */
export class VoteTallyResponseDto {
  @ApiProperty({ type: [VoteTallyQuestionDto] })
  questions!: VoteTallyQuestionDto[];
}

// ── Vote Participation ──────────────────────────────────

export class ParticipationOwnerDto {
  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ description: 'Share of the unit, e.g. "1/2".' })
  share!: string;

  /** True when this owner's user account is the membership the electorate
   *  snapshot recorded as the unit's representative — what the portal shows
   *  as "Common representative". */
  @ApiProperty()
  isRepresentative!: boolean;
}

export class ParticipationAnswerDto {
  @ApiProperty()
  questionId!: string;

  @ApiProperty()
  optionId!: string;

  /** Stored label, not a translation key — SINGLE_CHOICE questions carry
   *  free-text options that have no fixed semantics. */
  @ApiProperty()
  optionLabel!: string;

  @ApiProperty({ enum: VoteOptionSemantic })
  optionKey!: VoteOptionSemantic;
}

class AssemblyRecordOwnerDto {
  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  displayName!: string;
}

class AssemblyRecordAnswerDto {
  @ApiProperty()
  questionId!: string;

  @ApiProperty()
  optionId!: string;
}

class AssemblyRecordUnitDto {
  @ApiProperty()
  unitId!: string;

  @ApiProperty()
  unitNo!: string;

  @ApiProperty({ type: [AssemblyRecordOwnerDto] })
  owners!: AssemblyRecordOwnerDto[];

  @ApiProperty({ type: FractionDto })
  share!: FractionDto;

  @ApiProperty({ enum: ['ELIGIBLE', 'INELIGIBLE'] })
  eligibility!: 'ELIGIBLE' | 'INELIGIBLE';

  @ApiProperty({ nullable: true, type: String })
  ineligibleReason!: string | null;

  /** Null while the board has not reached this unit — distinct from ABSENT. */
  @ApiProperty({ nullable: true, enum: ['PRESENT', 'ABSENT'] })
  attendance!: 'PRESENT' | 'ABSENT' | null;

  @ApiProperty({ nullable: true, type: String })
  voterOwnerId!: string | null;

  @ApiProperty({ nullable: true, type: String })
  voterNote!: string | null;

  @ApiProperty({ type: [AssemblyRecordAnswerDto] })
  answers!: AssemblyRecordAnswerDto[];
}

class AssemblyRecordOptionDto {
  @ApiProperty()
  optionId!: string;

  @ApiProperty()
  optionKey!: string;

  @ApiProperty()
  label!: string;

  /** Both metrics travel: the screen leads with whichever decides the vote. */
  @ApiProperty({ type: FractionDto })
  weight!: FractionDto;

  @ApiProperty()
  unitCount!: number;
}

class AssemblyRecordQuestionDto {
  @ApiProperty()
  questionId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: [AssemblyRecordOptionDto] })
  options!: AssemblyRecordOptionDto[];
}

class AssemblyRecordTotalsDto {
  @ApiProperty({ type: FractionDto })
  allVotesWeight!: FractionDto;

  @ApiProperty({ type: FractionDto })
  presentWeight!: FractionDto;

  @ApiProperty()
  presentUnitCount!: number;

  @ApiProperty()
  absentUnitCount!: number;

  @ApiProperty()
  ineligibleUnitCount!: number;

  /** Present units that have not answered every question yet. */
  @ApiProperty()
  unitsAwaitingEntry!: number;

  @ApiProperty()
  quorate!: boolean;
}

export class AssemblyRecordResponseDto {
  @ApiProperty()
  voteTitle!: string;

  @ApiProperty({ nullable: true, type: String })
  meetingDate!: string | null;

  @ApiProperty({ enum: ['UNIT_SHARE', 'ONE_UNIT_ONE_VOTE'] })
  weightBasis!: 'UNIT_SHARE' | 'ONE_UNIT_ONE_VOTE';

  @ApiProperty({ type: AssemblyRecordTotalsDto })
  totals!: AssemblyRecordTotalsDto;

  @ApiProperty({ type: [AssemblyRecordUnitDto] })
  units!: AssemblyRecordUnitDto[];

  @ApiProperty({ type: [AssemblyRecordQuestionDto] })
  questions!: AssemblyRecordQuestionDto[];
}

export class VoteParticipationUnitDto {
  @ApiProperty()
  unitId!: string;

  @ApiProperty()
  unitNo!: string;

  @ApiProperty({ description: 'Building share, e.g. "5/100".' })
  share!: string;

  @ApiProperty({ enum: ['VOTED', 'NOT_VOTED', 'INELIGIBLE'] })
  status!: 'VOTED' | 'NOT_VOTED' | 'INELIGIBLE';

  /** The requester is an active owner of this unit, for any share. Drives
   *  the "Yours" marker. Present for every role. */
  @ApiProperty()
  ownsUnit!: boolean;

  /** The requester represents this unit but does not own it. Drives the
   *  "Proxy" marker. Present for every role. */
  @ApiProperty()
  isProxy!: boolean;

  // ── Board/admin/auditor only. Absent for unit owners; see
  //    GetVoteParticipationHandler, which is the single redaction point.

  @ApiProperty({ required: false, type: [String] })
  ownerNames?: string[];

  @ApiProperty({ required: false, enum: ['DIRECT', 'BOARD_PROXY'] })
  castMethod?: 'DIRECT' | 'BOARD_PROXY';

  @ApiProperty({ required: false, type: 'string', format: 'date-time' })
  castAt?: Date;

  /** Who recorded a paper ballot. Null for DIRECT ballots and when the
   *  recording membership no longer resolves to a user. */
  @ApiProperty({ required: false })
  recordedBy?: string;

  @ApiProperty({
    required: false,
    enum: ['NO_REPRESENTATIVE', 'MISSING_OWNERSHIP', 'ASSOCIATION_OWNED'],
  })
  ineligibleReason?: string;

  /** The requester represents this unit, so they should use the app booth
   *  rather than record their own paper ballot. */
  @ApiProperty({ required: false })
  isOwnUnit?: boolean;

  @ApiProperty({ required: false, type: [ParticipationOwnerDto] })
  owners?: ParticipationOwnerDto[];

  @ApiProperty({ required: false, type: [ParticipationAnswerDto] })
  answers?: ParticipationAnswerDto[];
}

export class VoteParticipationResponseDto {
  @ApiProperty({ type: [VoteParticipationUnitDto] })
  units!: VoteParticipationUnitDto[];
}
