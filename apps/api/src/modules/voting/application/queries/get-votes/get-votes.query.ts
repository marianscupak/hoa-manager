import { type TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

export class GetVotesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly roles: TenantMembershipRole[],
  ) {}
}
