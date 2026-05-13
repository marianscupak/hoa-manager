import type { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

export class GetVoteAuditExportQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly exportedByMembershipId: string,
    public readonly exporterRoles: TenantMembershipRole[],
  ) {}
}
