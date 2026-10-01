import { Visibility } from '@/modules/core/audit/domain/visibility';
import { TenantMembershipRole } from '@/shared/domain/membership';

import { VisibilityPolicyService } from './visibility-policy.service';

describe('VisibilityPolicyService', () => {
  let service: VisibilityPolicyService;

  beforeEach(() => {
    service = new VisibilityPolicyService();
  });

  describe('fromRoles', () => {
    it('returns only TENANT_PUBLIC for a UNIT_OWNER', () => {
      expect(service.fromRoles([TenantMembershipRole.UNIT_OWNER])).toEqual([
        Visibility.TENANT_PUBLIC,
      ]);
    });

    it('returns PUBLIC + PRIVILEGED for ADMIN', () => {
      expect(service.fromRoles([TenantMembershipRole.ADMIN])).toEqual([
        Visibility.TENANT_PUBLIC,
        Visibility.TENANT_PRIVILEGED,
      ]);
    });

    it('returns PUBLIC + PRIVILEGED for BOARD_MEMBER', () => {
      expect(service.fromRoles([TenantMembershipRole.BOARD_MEMBER])).toEqual([
        Visibility.TENANT_PUBLIC,
        Visibility.TENANT_PRIVILEGED,
      ]);
    });

    it('returns PUBLIC + PRIVILEGED for AUDITOR', () => {
      expect(service.fromRoles([TenantMembershipRole.AUDITOR])).toEqual([
        Visibility.TENANT_PUBLIC,
        Visibility.TENANT_PRIVILEGED,
      ]);
    });

    it('returns PUBLIC + PRIVILEGED if any role is privileged (multi-role)', () => {
      expect(
        service.fromRoles([
          TenantMembershipRole.UNIT_OWNER,
          TenantMembershipRole.AUDITOR,
        ]),
      ).toEqual([Visibility.TENANT_PUBLIC, Visibility.TENANT_PRIVILEGED]);
    });

    it('never returns SYSTEM_INTERNAL for any role combination', () => {
      const all = service.fromRoles([
        TenantMembershipRole.ADMIN,
        TenantMembershipRole.BOARD_MEMBER,
        TenantMembershipRole.AUDITOR,
        TenantMembershipRole.UNIT_OWNER,
      ]);
      expect(all).not.toContain(Visibility.SYSTEM_INTERNAL);
    });

    it('returns PUBLIC for an empty roles array', () => {
      expect(service.fromRoles([])).toEqual([Visibility.TENANT_PUBLIC]);
    });
  });
});
