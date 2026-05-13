import { Injectable } from '@nestjs/common';

import { Visibility } from '@/modules/core/audit/domain/visibility';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

const PRIVILEGED_ROLES = new Set<TenantMembershipRole>([
  TenantMembershipRole.ADMIN,
  TenantMembershipRole.BOARD_MEMBER,
  TenantMembershipRole.AUDITOR,
]);

@Injectable()
export class VisibilityPolicyService {
  fromRoles(roles: TenantMembershipRole[]): Visibility[] {
    const allowed: Visibility[] = [Visibility.TENANT_PUBLIC];
    if (roles.some((r) => PRIVILEGED_ROLES.has(r))) {
      allowed.push(Visibility.TENANT_PRIVILEGED);
    }
    return allowed;
  }
}
