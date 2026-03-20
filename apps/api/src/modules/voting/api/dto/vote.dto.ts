import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  MajorityRuleType,
  QuorumElectorateBasis,
  QuorumMeasure,
  VoteOptionSemantic,
  VoteQuestionType,
  VoteStatus,
  VoteWeightBasis,
  OwningUnitStatus,
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

  @ApiProperty()
  requiresDelegation!: boolean;

  @ApiProperty()
  isDelegated!: boolean;
}

export class VoteListItemResponseDto extends CreateVoteResponseDto {
  @ApiProperty({ type: VoterSummaryDto, required: false, nullable: true })
  voterSummary?: VoterSummaryDto | null;

  @ApiProperty()
  allowCoOwnerIndividualVote!: boolean;
}

export class OwningUnitStatusDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  share!: string;

  @ApiProperty()
  status!: OwningUnitStatus;
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

export class CreateVoteConsentDto extends createZodDto(createVoteConsentSchema) {}

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
