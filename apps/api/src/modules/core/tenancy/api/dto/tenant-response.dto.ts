import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  roleEnum,
  statusEnum,
} from '@/infrastructure/db/schema/core/tenant-memberships';

export const TenantResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  role: z.enum(roleEnum.enumValues),
  status: z.enum(statusEnum.enumValues),
});

export class TenantResponseDto extends createZodDto(TenantResponseSchema) {}
