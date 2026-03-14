import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

export interface AuthClaims {
  sub: string;
  email?: string;
  fullName?: string;
  preferredLanguage?: string;
  tid?: string;
  mid?: string;
  roles?: TenantMembershipRole[];
}
