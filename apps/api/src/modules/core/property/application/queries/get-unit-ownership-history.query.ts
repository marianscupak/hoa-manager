import type { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

export class GetUnitOwnershipHistoryQuery {
  constructor(
    public readonly tenantId: string,
    public readonly unitId: string,
    public readonly membershipId: string,
    public readonly roles: TenantMembershipRole[],
  ) {}
}
