import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const tenantContactResponseSchema = z.object({
  fullName: z.string(),
  email: z.string(),
});

export class TenantContactResponseDto extends createZodDto(
  tenantContactResponseSchema,
) {}
