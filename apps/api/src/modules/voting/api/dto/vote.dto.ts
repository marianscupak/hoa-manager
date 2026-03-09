import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';

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
