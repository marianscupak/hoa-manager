import { ApiProperty } from '@nestjs/swagger';

export class TenantActivityEntryDto {
  @ApiProperty() id!: string;
  @ApiProperty({ type: String, format: 'date-time' }) occurredAt!: string;
  @ApiProperty() eventType!: string;
  @ApiProperty() message!: string;
  @ApiProperty({ type: String, nullable: true })
  navigateTo!: string | null;
}

export class TenantActivityResponseDto {
  @ApiProperty({ type: [TenantActivityEntryDto] })
  entries!: TenantActivityEntryDto[];
}
