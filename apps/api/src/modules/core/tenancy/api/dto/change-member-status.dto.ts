import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TenantMembershipStatus } from '@/modules/core/tenancy/domain/tenant.entity';

export const changeMemberStatusSchema = z.object({
  status: z.enum([
    TenantMembershipStatus.ACTIVE,
    TenantMembershipStatus.SUSPENDED,
  ]),
});

export class ChangeMemberStatusDto extends createZodDto(
  changeMemberStatusSchema,
) {}
