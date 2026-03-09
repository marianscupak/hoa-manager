import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  MajorityRuleType,
  QuorumElectorateBasis,
  QuorumMeasure,
  VoteStatus,
  VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';

export const createVoteSchema = z.object({
  title: z.string(),
  description: z.string(),
  scheduledFrom: z.coerce.date().optional(),
  scheduledTo: z.coerce.date().optional(),
});

export class CreateVoteDto extends createZodDto(createVoteSchema) {}

export class CreateVoteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  scheduledFrom!: Date;

  @ApiProperty()
  scheduledTo!: Date;

  @ApiProperty()
  status!: VoteStatus;
}

export const setVoteRulesetSchema = z.object({
  weightBasis: z.nativeEnum(VoteWeightBasis),
  quorumMeasure: z.nativeEnum(QuorumMeasure),
  quorumElectorateBasis: z.nativeEnum(QuorumElectorateBasis),
  quorumThreshold: z.number().positive(),
  majorityRuleType: z.nativeEnum(MajorityRuleType),
  majorityThreshold: z.number().positive().nullable(),
  allowAbstain: z.boolean(),
  abstainExcludedFromMajorityDenominator: z.boolean(),
});

export class SetVoteRulesetDto extends createZodDto(setVoteRulesetSchema) {}

export class SetVoteRulesetResponseDto extends SetVoteRulesetDto {}
