import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

export class GetVoteParticipationQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly requesterMembershipId: string,
    public readonly roles: TenantMembershipRole[],
  ) {}
}
