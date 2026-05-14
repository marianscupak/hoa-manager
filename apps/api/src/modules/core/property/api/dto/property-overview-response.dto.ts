import { ApiProperty } from '@nestjs/swagger';

export class UnitsOverviewDto {
  @ApiProperty() total!: number;
  @ApiProperty() withoutOwnersCount!: number;
  @ApiProperty({
    description: 'Sum of unit buildingShare values as a percentage',
  })
  buildingShareSum!: number;
}

export class OwnersOverviewDto {
  @ApiProperty({ description: 'Active owners (excludes pending-invite owners)' })
  active!: number;
}

export class InvitesOverviewDto {
  @ApiProperty() pending!: number;
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  oldestPendingCreatedAt!: string | null;
}

export class PropertyOverviewResponseDto {
  @ApiProperty({ type: UnitsOverviewDto }) units!: UnitsOverviewDto;
  @ApiProperty({ type: OwnersOverviewDto }) owners!: OwnersOverviewDto;
  @ApiProperty({ type: InvitesOverviewDto }) invites!: InvitesOverviewDto;
}
