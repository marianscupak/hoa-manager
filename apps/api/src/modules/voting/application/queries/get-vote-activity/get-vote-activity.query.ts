import type { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

export class GetVoteActivityQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly viewerUserId: string,
    public readonly viewerRoles: TenantMembershipRole[],
    public readonly viewerLanguage: string,
  ) {}
}
