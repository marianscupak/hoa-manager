import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { type QuestionOutcome } from '@/modules/voting/domain/vote/question-outcome';
import {
  MajorityRuleType,
  QuorumElectorateBasis,
  QuorumMeasure,
  VoteOptionSemantic,
  VoteQuestionType,
  VoteStatus,
  VoteWeightBasis,
  OwningUnitStatus,
  ElectorateIneligibleReason,
} from '@/modules/voting/domain/vote/vote.types';

export const createVoteSchema = z.object({
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

export class CreateVoteDto extends createZodDto(createVoteSchema) {}
export class UpdateVoteDto extends createZodDto(createVoteSchema) {}

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
}

export const setVoteRulesetSchema = z.object({
  weightBasis: z.nativeEnum(VoteWeightBasis),
  quorumMeasure: z.nativeEnum(QuorumMeasure),
  quorumElectorateBasis: z.nativeEnum(QuorumElectorateBasis),
  quorumThreshold: z.number().min(0).max(100),
  majorityRuleType: z.nativeEnum(MajorityRuleType),
  majorityThreshold: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .transform((v) => v ?? null),
  allowAbstain: z.boolean(),
  abstainExcludedFromMajorityDenominator: z.boolean(),
  allowCoOwnerIndividualVote: z.boolean(),
});

export class SetVoteRulesetDto extends createZodDto(setVoteRulesetSchema) {}

export class SetVoteRulesetResponseDto extends SetVoteRulesetDto {}

export const createVoteQuestionOptionSchema = z.object({
  label: z.string().min(1),
  sortOrder: z.number().int().optional(),
});
export class CreateVoteQuestionOptionDto extends createZodDto(
  createVoteQuestionOptionSchema,
) {}

export const createVoteQuestionSchema = z
  .object({
    title: z.string().min(1),
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

export class VoteDetailResponseDto extends CreateVoteResponseDto {
  @ApiProperty({
    type: SetVoteRulesetResponseDto,
    required: false,
    nullable: true,
  })
  ruleset!: SetVoteRulesetResponseDto | null;

  @ApiProperty({ type: [VoteQuestionResponseDto] })
  questions!: VoteQuestionResponseDto[];
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

  @ApiProperty()
  allowCoOwnerIndividualVote!: boolean;

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

export class TotalVotingPowerDto {
  @ApiProperty()
  value!: number;

  @ApiProperty()
  maximum!: number;
}

export class VoterStatusResponseDto {
  @ApiProperty()
  canVote!: boolean;

  @ApiProperty({ type: TotalVotingPowerDto })
  totalVotingPower!: TotalVotingPowerDto;

  @ApiProperty({ type: [OwningUnitStatusDto] })
  owningUnits!: OwningUnitStatusDto[];
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
  ownerMembershipId: z.string().uuid().optional(),
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

// ── Vote Results ──────────────────────────────────────

export class VoteOptionResultDto {
  @ApiProperty()
  optionId!: string;

  @ApiProperty()
  voteWeight!: number;

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

  @ApiProperty({ type: 'number', nullable: true })
  majorityThresholdValue!: number | null;

  @ApiProperty()
  majorityDenominatorValue!: number;

  @ApiProperty({ type: [VoteOptionResultDto] })
  optionResults!: VoteOptionResultDto[];
}

export class VoteResultsResponseDto {
  @ApiProperty({ enum: ['COMPUTED', 'FAILED'] })
  resultStatus!: 'COMPUTED' | 'FAILED';

  @ApiProperty()
  quorumMet!: boolean;

  @ApiProperty()
  participationWeight!: number;

  @ApiProperty()
  participationUnitCount!: number;

  @ApiProperty()
  denominatorWeight!: number;

  @ApiProperty()
  denominatorUnitCount!: number;

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

  @ApiProperty()
  participationWeight!: number;

  @ApiProperty()
  eligibleWeight!: number;
}
