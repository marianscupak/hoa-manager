import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TenantMembershipRole } from '@/shared/domain/membership';

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(TenantMembershipRole),
});

export class UpdateMemberRoleDto extends createZodDto(updateMemberRoleSchema) {}
