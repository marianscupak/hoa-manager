import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SwitchTenantSchema = z.object({
  tenantId: z.uuid('Must be a valid tenant UUID'),
});

export class SwitchTenantDto extends createZodDto(SwitchTenantSchema) {}
