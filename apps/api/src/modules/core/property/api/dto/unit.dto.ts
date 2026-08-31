import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUnitSchema = z.object({
  unitNo: z
    .string()
    .min(1, 'Unit number is required')
    .max(50)
    .describe('The unit number or label'),
  buildingShareNumerator: z
    .number()
    .int('Must be an integer')
    .min(1, 'Must be at least 1')
    .describe('The numerator of the building share fraction'),
  buildingShareDenominator: z
    .number()
    .int('Must be an integer')
    .min(1, 'Must be at least 1')
    .describe('The denominator of the building share fraction'),
});

export class CreateUnitDto extends createZodDto(createUnitSchema) {}

export const updateUnitSchema = z.object({
  unitNo: z
    .string()
    .min(1, 'Unit number is required')
    .max(50)
    .describe('The unit number or label'),
  buildingShareNumerator: z
    .number()
    .int('Must be an integer')
    .min(1, 'Must be at least 1')
    .describe('The numerator of the building share fraction'),
  buildingShareDenominator: z
    .number()
    .int('Must be an integer')
    .min(1, 'Must be at least 1')
    .describe('The denominator of the building share fraction'),
});

export class UpdateUnitDto extends createZodDto(updateUnitSchema) {}

export class CreateUnitResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the newly created unit',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  unitId!: string;
}

const ownershipPartySchema = z.object({
  partyType: z.enum(['SOLE', 'SJM']),
  shareNumerator: z.number().int().min(1),
  shareDenominator: z.number().int().min(1),
  memberOwnerIds: z.array(z.string().uuid()).min(1).max(2),
});

export const replaceOwnershipsSchema = z.object({
  ownerships: z
    .array(ownershipPartySchema)
    .min(1, 'At least one ownership is required')
    .describe('List of ownerships to replace the current active ones'),
});

export class ReplaceOwnershipsDto extends createZodDto(
  replaceOwnershipsSchema,
) {}

export class UnitResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  unitNo!: string;

  @ApiProperty({ description: 'Numerator of the building share fraction' })
  buildingShareNumerator!: number;

  @ApiProperty({ description: 'Denominator of the building share fraction' })
  buildingShareDenominator!: number;

  @ApiProperty({
    type: [String],
    description: 'Display names of the current owners of this unit',
  })
  owners!: string[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class UnitOwnershipMemberResponseDto {
  @ApiProperty()
  ownerId!: string;
  @ApiProperty()
  displayName!: string;
  @ApiProperty({ enum: ['PERSON', 'LEGAL_ENTITY', 'ASSOCIATION'] })
  kind!: 'PERSON' | 'LEGAL_ENTITY' | 'ASSOCIATION';
}

export class UnitOwnershipResponseDto {
  @ApiProperty()
  id!: string;
  @ApiProperty({ enum: ['SOLE', 'SJM'] })
  partyType!: 'SOLE' | 'SJM';
  @ApiProperty()
  shareNumerator!: number;
  @ApiProperty()
  shareDenominator!: number;
  @ApiProperty({ description: 'Decimal representation of the share, 4dp' })
  shareDecimal!: string;
  @ApiProperty({ type: [UnitOwnershipMemberResponseDto] })
  members!: UnitOwnershipMemberResponseDto[];
}

export class UnitDetailResponseDto extends UnitResponseDto {
  @ApiProperty({ type: [UnitOwnershipResponseDto] })
  ownerships!: UnitOwnershipResponseDto[];
}
