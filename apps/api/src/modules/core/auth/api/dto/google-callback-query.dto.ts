import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GoogleCallbackQuerySchema = z
  .object({
    code: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    error: z.string().min(1).optional(),
    error_description: z.string().optional(),
  })
  .refine((q) => Boolean(q.code) || Boolean(q.error), {
    message: 'Either "code" or "error" must be present',
  });

export class GoogleCallbackQueryDto extends createZodDto(
  GoogleCallbackQuerySchema,
) {}
