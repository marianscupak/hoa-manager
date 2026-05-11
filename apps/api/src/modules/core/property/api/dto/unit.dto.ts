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

export const replaceOwnershipsSchema = z.object({
  ownerships: z
    .array(
      z.object({
        ownerId: z.uuid(),
        share: z
          .string()
          .regex(/^\d+(\.\d+)?$/, 'Must be a valid decimal number'),
      }),
    )
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

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class UnitOwnershipResponseDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  tenantId!: string;
  @ApiProperty()
  unitId!: string;
  @ApiProperty()
  ownerId!: string;
  @ApiProperty()
  share!: string;
  @ApiProperty()
  validFrom!: Date;
  @ApiProperty({ nullable: true, type: Date })
  validTo!: Date | null;
}

export class UnitDetailResponseDto extends UnitResponseDto {
  @ApiProperty({ type: [UnitOwnershipResponseDto] })
  ownerships!: UnitOwnershipResponseDto[];
}
