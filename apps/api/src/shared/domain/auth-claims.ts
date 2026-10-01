import { TenantMembershipRole } from '@/shared/domain/membership';

export interface AuthClaims {
  sub: string;
  email?: string;
  fullName?: string;
  preferredLanguage?: string;
  tid?: string;
  mid?: string;
  roles?: TenantMembershipRole[];
}
