import { ApiProperty } from '@nestjs/swagger';

export class OwnedUnitResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  unitNo!: string;

  @ApiProperty({
    description: "Caller's share of the unit, as a percentage",
  })
  ownerSharePct!: number;

  @ApiProperty({
    description: "Unit's share of the building, as a percentage",
  })
  buildingSharePct!: number;
}
