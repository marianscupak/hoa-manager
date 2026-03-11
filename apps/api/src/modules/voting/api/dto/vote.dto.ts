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

export class CreateVoteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: 'string', required: false, nullable: true })
  description!: string | null;

  @ApiProperty({ required: false, nullable: true })
  scheduledFrom!: Date | null;

  @ApiProperty({ required: false, nullable: true })
  scheduledTo!: Date | null;

  @ApiProperty()
  status!: VoteStatus;
}

export const setVoteRulesetSchema = z.object({
  weightBasis: z.nativeEnum(VoteWeightBasis),
  quorumMeasure: z.nativeEnum(QuorumMeasure),
  quorumElectorateBasis: z.nativeEnum(QuorumElectorateBasis),
  quorumThreshold: z.number().min(0),
  majorityRuleType: z.nativeEnum(MajorityRuleType),
  majorityThreshold: z
    .number()
    .min(0)
    .optional()
    .transform((v) => v ?? null),
  allowAbstain: z.boolean(),
  abstainExcludedFromMajorityDenominator: z.boolean(),
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
}

export class VoteDetailResponseDto extends CreateVoteResponseDto {
  @ApiProperty({ type: SetVoteRulesetResponseDto, required: false, nullable: true })
  ruleset!: SetVoteRulesetResponseDto | null;

  @ApiProperty({ type: [VoteQuestionResponseDto] })
  questions!: VoteQuestionResponseDto[];
}
