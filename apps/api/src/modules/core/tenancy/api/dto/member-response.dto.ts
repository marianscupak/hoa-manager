import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';

export const memberUserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string(),
});

export const memberResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  role: z.nativeEnum(TenantMembershipRole),
  status: z.nativeEnum(TenantMembershipStatus),
  user: memberUserResponseSchema,
  createdAt: z.string(),
});

export class MemberResponseDto extends createZodDto(memberResponseSchema) {}
