import { TenantMembershipRole } from '@/modules/tenancy/domain/tenant.entity';

export interface AuthClaims {
  sub: string;
  tid?: string;
  mid?: string;
  roles?: TenantMembershipRole[];
}
