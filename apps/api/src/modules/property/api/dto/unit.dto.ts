import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUnitSchema = z.object({
  unitNo: z
    .string()
    .min(1, 'Unit number is required')
    .max(50)
    .describe('The unit number or label'),
  buildingShare: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Must be a valid decimal number')
    .describe('The building share as a decimal string'),
});

export class CreateUnitDto extends createZodDto(createUnitSchema) {}

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

  @ApiProperty()
  buildingShare!: string;

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

export class UnitDetailResponseDto {
  @ApiProperty()
  unit!: UnitResponseDto;

  @ApiProperty({ type: [UnitOwnershipResponseDto] })
  activeOwnerships!: UnitOwnershipResponseDto[];
}
