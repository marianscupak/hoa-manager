import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateUserLanguageSchema = z.object({
  language: z.string().min(2).max(5),
});

export class UpdateUserLanguageDto extends createZodDto(
  updateUserLanguageSchema,
) {}
