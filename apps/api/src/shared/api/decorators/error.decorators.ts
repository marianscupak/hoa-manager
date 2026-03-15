import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ErrorResponseDto } from '@/shared/api/dto/error-response.dto';

export function ApiErrorResponses() {
  return applyDecorators(
    ApiBadRequestResponse({
      type: ErrorResponseDto,
      description: 'Bad Request - Validation or Domain logic error',
    }),
    ApiUnauthorizedResponse({
      type: ErrorResponseDto,
      description: 'Unauthorized',
    }),
    ApiNotFoundResponse({
      type: ErrorResponseDto,
      description: 'Resource not found',
    }),
    ApiInternalServerErrorResponse({
      type: ErrorResponseDto,
      description: 'Internal server error',
    }),
  );
}
