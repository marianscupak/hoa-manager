import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(TenantMembershipRole),
});

export class UpdateMemberRoleDto extends createZodDto(updateMemberRoleSchema) {}
