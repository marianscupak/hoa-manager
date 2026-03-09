import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

export interface AuthClaims {
  sub: string;
  email?: string;
  fullName?: string;
  tid?: string;
  mid?: string;
  roles?: TenantMembershipRole[];
}
