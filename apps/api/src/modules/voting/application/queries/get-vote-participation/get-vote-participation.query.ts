import { TenantMembershipRole } from '@/shared/domain/membership';

export class GetVoteParticipationQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly requesterMembershipId: string,
    public readonly roles: TenantMembershipRole[],
  ) {}
}
