import { ApiProperty } from '@nestjs/swagger';

export class TimelineEntryDto {
  @ApiProperty() id!: string;
  @ApiProperty() occurredAt!: string;
  @ApiProperty() eventType!: string;
  @ApiProperty() message!: string;
  @ApiProperty({ type: String, nullable: true })
  navigateTo!: string | null;
  @ApiProperty({ required: false, type: Object })
  details?: Record<string, unknown>;
}

export class VoteActivityResponseDto {
  @ApiProperty({ type: [TimelineEntryDto] })
  entries!: TimelineEntryDto[];
}
