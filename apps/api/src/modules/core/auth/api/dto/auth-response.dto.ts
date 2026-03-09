import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AuthResponseSchema = z.object({
  accessToken: z.string(),
});

export class AuthResponseDto extends createZodDto(AuthResponseSchema) {}

const SuccessResponseSchema = z.object({
  success: z.boolean(),
});

export class SuccessResponseDto extends createZodDto(SuccessResponseSchema) {}
