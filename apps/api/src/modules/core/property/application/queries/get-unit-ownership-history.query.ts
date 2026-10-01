import type { TenantMembershipRole } from '@/shared/domain/membership';

export class GetUnitOwnershipHistoryQuery {
  constructor(
    public readonly tenantId: string,
    public readonly unitId: string,
    public readonly membershipId: string,
    public readonly roles: TenantMembershipRole[],
  ) {}
}
