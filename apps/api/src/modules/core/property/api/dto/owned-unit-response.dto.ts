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
    enum: ['SOLE', 'SJM'],
    description: 'The party type through which the caller holds the unit',
  })
  partyType!: 'SOLE' | 'SJM';

  @ApiProperty({
    description: "Unit's share of the building, as a percentage",
  })
  buildingSharePct!: number;
}
