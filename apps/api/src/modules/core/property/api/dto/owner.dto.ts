import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createOwnerSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(255)
    .describe('Display name of the owner'),
  email: z.email().optional().describe('Optional email address for the owner'),
  userId: z
    .uuid()
    .optional()
    .describe('Optional user ID if linking to an existing user account'),
  kind: z
    .enum(['PERSON', 'LEGAL_ENTITY', 'ASSOCIATION'])
    .optional()
    .default('PERSON')
    .describe('The legal kind of the owner'),
});

export class CreateOwnerDto extends createZodDto(createOwnerSchema) {}

export class CreateOwnerResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the newly created owner',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  ownerId!: string;
}

export class OwnerResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ nullable: true, type: String })
  email!: string | null;

  @ApiProperty({ nullable: true, type: String })
  userId!: string | null;

  @ApiProperty({ enum: ['PERSON', 'LEGAL_ENTITY', 'ASSOCIATION'] })
  kind!: 'PERSON' | 'LEGAL_ENTITY' | 'ASSOCIATION';

  @ApiProperty({
    nullable: true,
    type: String,
    enum: ['pending', 'expired'],
    description:
      'Status of the invite for this owner, null if no pending invite',
  })
  inviteStatus!: 'pending' | 'expired' | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
