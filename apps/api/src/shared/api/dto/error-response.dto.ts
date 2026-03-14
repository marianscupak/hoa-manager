import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty()
  code!: string;

  @ApiProperty({ required: false })
  details?: any;
}
