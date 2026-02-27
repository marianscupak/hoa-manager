import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateTenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
});

export class CreateTenantDto extends createZodDto(CreateTenantSchema) {}

export const CreateTenantResponseSchema = z.object({
  tenantId: z.uuid(),
});

export class CreateTenantResponseDto extends createZodDto(
  CreateTenantResponseSchema,
) {}
