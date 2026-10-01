import type { TenantMembershipRole } from '@/shared/domain/membership';

export class GetVoteAuditExportQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly exportedByMembershipId: string,
    public readonly exporterRoles: TenantMembershipRole[],
  ) {}
}
